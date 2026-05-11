# Общий обзор архитектуры Atlas

## Что такое Atlas

Atlas — это кроссплатформенный файловый менеджер, построенный на:
- **Electron** — для нативного десктопного приложения
- **Vue 3** — для UI интерфейса
- **TypeScript** — для типобезопасности

Архитектура вдохновлена **Visual Studio Code** и использует те же паттерны: Dependency Injection, Service-Oriented Architecture, sandboxed renderer, shared process.

## Из чего состоит приложение

Приложение состоит из **трёх процессов**:

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Process                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Application     │ │ ElectronIPCServer│ │ SharedProcess   │   │
│  │ (DI контейнер)  │ │ (multi-connection)│ │ (utilityProcess)│   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│                                                              │
│  Сервисы: Logger, Windows, NativeHost, Lifecycle, Update... │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ ipcRenderer / MessagePort
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Vue 3 App     │ │ ElectronIPC   │ │ SharedProcess    │   │
│  │ (UI)          │ │ Client        │ │ Service          │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│                                                              │
│  Сервисы: Commands, Keybindings, ContextKeys... (proxies)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ MessagePort (через main)
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Shared Process                             │
│  ┌──────────────┐                                           │
│  │ ChannelServer │  (фоновые задачи: поиск, индексация...)  │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

### 1. Main Process (`src/main/`)

**Роль:** Оркестратор. Создаёт окна, управляет жизненным циклом приложения, интегрируется с OS, запускает shared process.

**Ключевые файлы:**
- `main.ts` — точка входа. Создаёт корневой DI-контейнер и запускает `Application`
- `app.ts` — класс `Application`. Управляет стартом приложения: security, IPC сервер, shared process, окна

**Сервисы:**
- `LifecycleMainService` — фазы жизни, shutdown
- `WindowsMainService` — создание и управление окнами
- `NativeHostMainService` — `shell.openExternal`, диалоги
- `UpdateService` — автообновление
- `FileLogger` — логирование в файл
- `NodeProcessService` — запуск дочерних процессов

### 2. Renderer Process (`src/renderer/`)

**Роль:** UI приложения. Работает в sandboxed-окружении (без доступа к Node.js).

**Ключевые файлы:**
- `main.ts` — точка входа renderer. Создаёт Vue app, настраивает DI, подключается к main через IPC
- `app.vue` — корневой компонент Vue

**Сервисы:**
- `ILogger`, `INodeProcess` — прокси через IPC (реальная реализация в main)
- `ICommandRegistry`, `ICommandService` — система команд
- `IKeybindingService` — горячие клавиши
- `IContextKeyService` — контекстные ключи для условий

### 3. Shared Process (`src/shared-process/`)

**Роль:** Фоновый процесс для тяжёлых операций (поиск, file watching, extensions). Работает как `utilityProcess` (новый API Electron).

**Ключевые файл:**
- `shared-process-main.ts` — точка входа. Создаёт `ChannelServer` через `MessagePort`

### 4. Preload Script (`src/preload/`)

**Роль:** Единственный скрипт с привилегиями Node.js в renderer. Безопасно пробрасывает минимальный API через `contextBridge`.

**Ключевой файл:**
- `preload.ts` — `window.app` API: `ipcSend`, `ipcOn`, MessagePort forwarding

## Архитектурные принципы

### Service-Oriented Architecture
Вся бизнес-логика — в сервисах. Каждый сервис:
- Имеет интерфейс (`ILogger`)
- Имеет идентификатор (`createDecorator`)
- Регистрируется в DI-контейнере
- Может быть заменён на mock для тестов

### Disposable Pattern
Каждый сервис, создающий ресурсы, реализует `IDisposable`:
```ts
class MyService extends Disposable {
  constructor() {
    super();
    const subscription = someEvent.on(() => { ... });
    this._register(subscription); // автоматически dispose при shutdown
  }
}
```

### Process Scopes
Каждый сервис живёт в определённом процессе:
- `common/` — интерфейсы (все процессы)
- `electron-main/` — реализация для main process
- `renderer/` — реализация для renderer
- `electron-browser/` — renderer-код, зависящий от Electron API

### Strict Security
- Renderer работает в sandbox (`sandbox: true`)
- `contextIsolation: true` — preload и renderer изолированы
- `nodeIntegration: false` — renderer не имеет доступа к Node.js
- Навигация блокируется
- Только preload может вызывать `require('electron')`
