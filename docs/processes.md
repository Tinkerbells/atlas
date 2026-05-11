# Процессы в Atlas

Electron-приложение состоит из нескольких процессов. Каждый процесс изолирован и имеет свою роль.

## Main Process (главный процесс)

**Где:** `src/main/`
**Запускается:** первым при старте приложения
**Доступ к Node.js:** полный
**Количество:** ровно 1

### Зачем нужен
Main process — это "сервер" приложения. Он:
- Создаёт окна (BrowserWindow)
- Управляет жизненным циклом приложения (quit, reload)
- Общается с OS (shell, диалоги, tray)
- Запускает shared process
- Регистрирует IPC-каналы
- Хранит глобальное состояние

### Жизненный цикл

```
main.ts
  └── app.whenReady()
        └── initApp()
              ├── createServices()     // DI контейнер
              ├── Application.createInstance()
              └── app.startup()
                    ├── configureSession()   // security
                    ├── new ElectronIPCServer() // IPC
                    ├── setupSharedProcess()   // utility process
                    ├── initServices()         // child DI
                    ├── initChannels()         // register IPC channels
                    └── openFirstWindow()      // BrowserWindow
```

### Ключевые классы

| Класс | Файл | Назначение |
|-------|------|------------|
| `Application` | `src/main/app.ts` | Главный оркестратор. Создаёт сервисы, IPC, окна |
| `LifecycleMainService` | `src/platform/lifecycle/...` | Управляет фазами: Starting → Ready → AfterWindowOpen → Eventually |
| `WindowsMainService` | `src/platform/windows/...` | Создаёт и управляет BrowserWindow |
| `ElectronIPCServer` | `src/core/ipc/electron-main/...` | Multi-connection IPC сервер. Слушает `app:hello` от рендереров |

---

## Renderer Process (процесс отрисовки)

**Где:** `src/renderer/`
**Запускается:** при создании BrowserWindow
**Доступ к Node.js:** нет (sandboxed)
**Количество:** по одному на каждое окно

### Зачем нужен
Renderer process — это "клиент" приложения. Он:
- Рендерит Vue 3 UI
- Обрабатывает пользовательский ввод
- Отправляет команды в main process через IPC
- Получает события из main process через IPC

### Ограничения
Renderer **не может** напрямую:
- Читать/писать файлы (`fs`)
- Запускать дочерние процессы (`child_process`)
- Вызывать `require('electron')`
- Доступаться к `process.env` (полностью)

Всё взаимодействие с OS идёт через **IPC**.

### Ключевые классы

| Класс | Файл | Назначение |
|-------|------|------------|
| `ElectronIPCMainProcessService` | `src/renderer/services/main-process/...` | Клиент к main process IPC |
| `SharedProcessService` | `src/renderer/services/shared-process/...` | Клиент к shared process через MessagePort |
| Vue composables | `src/renderer/composables/` | Мост между Vue и DI-сервисами |

### Как renderer получает сервисы

```ts
// ui/main.ts
const main-process-service = new ElectronIPCMainProcessService();

// Получаем прокси-сервисы из main process
const logger = ProxyChannel.toService<ILogger>(main-process-service.getChannel("logger"));
const nodeProcess = ProxyChannel.toService<INodeProcess>(main-process-service.getChannel("nodeProcess"));

// Регистрируем в DI
services.set(ILogger, logger);
services.set(INodeProcess, nodeProcess);
```

---

## Preload Script (скрипт предзагрузки)

**Где:** `src/preload/preload.ts`
**Запускается:** перед загрузкой renderer, один раз на окно
**Доступ к Node.js:** полный (но ограниченный Electron)
**Количество:** по одному на каждое окно

### Зачем нужен
Preload — это **мост** между main и renderer. Он:
- Имеет доступ к `require('electron')`
- Безопасно пробрасывает API через `contextBridge`
- Валидирует IPC-каналы (только `app:*` разрешены)
- Пересылает MessagePort для shared process

### Почему не просто `nodeIntegration: true`

Если включить `nodeIntegration`, renderer получит полный доступ к Node.js. Это опасно:
- Зловредный код (например, из расширения) сможет читать файлы
- Renderer сможет вызывать любые системные команды
- Уязвимость к XSS → полный доступ к системе

Preload решает эту проблему:
- Renderer работает в **sandbox** (как обычная web-страница)
- Preload — единственный скрипт с привилегиями
- Через `contextBridge` preload экспонирует **минимальный** API

### Что экспонируется

```ts
window.app = {
  // Отправить сообщение в main process
  ipcSend(channel: string, ...args: any[]): void,
  
  // Подписаться на сообщения из main process
  ipcOn(channel: string, listener: (...args: any[]) => void): () => void,
}
```

Renderer не видит полный `ipcRenderer`. Он видит только валидированные методы.

### Формат
Preload компилируется в **CJS** (CommonJS), а не ESM:
```js
const { contextBridge, ipcRenderer } = require('electron');
```

Причина: в sandboxed renderer `import` может не работать корректно, а `require` — нативный Node.js механизм.

---

## Shared Process (общий процесс)

**Где:** `src/shared-process/`
**Запускается:** при старте приложения (utilityProcess.fork)
**Доступ к Node.js:** полный
**Количество:** ровно 1

### Зачем нужен
Shared process — это фоновый worker. Он выполняет тяжёлые операции, которые не должны блокировать main process:
- Поиск по файлам (ripgrep)
- File watching
- Индексация
- Расширения (extensions)

Если бы эти операции выполнялись в main process, UI зависал бы.

### Как он работает

```
Main Process                    Shared Process
     │                                │
     │ utilityProcess.fork()          │
     ├───────────────────────────────>│
     │                                │
     │ MessageChannelMain             │
     │ { port1, port2 }               │
     │                                │
     │ postMessage("app:init", [port1])│
     ├───────────────────────────────>│  parentPort.on("message", ...)
     │                                │  // создаёт ChannelServer
     │                                │
     ◄────────────────────────────────┤  // port2 в main
```

### Как renderer общается с shared process

Renderer **не может** напрямую создать utility process. Поэтому:

```
Renderer          Main Process          Shared Process
   │                   │                      │
   │ app:request       │                      │
   │ SharedProcessPort │                      │
   ├──────────────────>│                      │
   │                   │ createConnection()   │
   │                   │ MessageChannelMain   │
   │                   ├─────────────────────>│
   │                   │                      │
   │                   │ port2                │
   │                   │ webContents.send()   │
   │<──────────────────┤                      │
   │                   │                      │
   │ MessagePort       │                      │
   │ (прямое соединение)                     │
   ├─────────────────────────────────────────>│
```

После установления соединения renderer и shared process общаются **напрямую** через `MessagePort`, без участия main process.

### Ключевой файл

| Класс/Файл | Назначение |
|------------|------------|
| `shared-process-main.ts` | Точка входа. Создаёт `ChannelServer` через `MessagePort` |

---

## Сравнение процессов

| Характеристика | Main | Renderer | Shared | Preload |
|----------------|------|----------|--------|---------|
| Количество | 1 | 1+ | 1 | 1 на окно |
| Node.js | ✅ Полный | ❌ Нет (sandbox) | ✅ Полный | ✅ Полный |
| UI | ❌ Нет | ✅ Vue 3 | ❌ Нет | ❌ Нет |
| OS доступ | ✅ Да | ❌ Через IPC | ✅ Да | ✅ Да |
| Жизнь | Всё приложение | Пока окно открыто | Всё приложение | Пока окно открыто |
| Роль | Оркестратор | UI клиент | Worker | Мост |

---

## Когда что использовать

### Main Process
- Создание окон
- Работа с файловой системой (если не в shared)
- Логирование
- Интеграция с OS (tray, menu, notifications)
- Управление жизненным циклом

### Renderer Process
- Отрисовка UI
- Обработка пользовательского ввода
- Вызов команд (через IPC)
- Работа с DOM

### Shared Process
- Поиск по файлам
- File watching
- Индексация
- Тяжёлые вычисления
- Расширения (extensions)

### Preload Script
- **Только** для безопасного пробрасывания API
- Валидация IPC-каналов
- Пересылка MessagePort
- Не для бизнес-логики!
