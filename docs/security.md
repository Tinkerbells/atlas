# Безопасность в Atlas

Приложение использует многоуровневую модель безопасности, вдохновлённую VS Code. Renderer process полностью изолирован от системы.

## Модель угроз

Renderer process загружает:
- Пользовательский контент (файлы, расширения)
- Webview (для preview файлов)
- Внешние URL (в dev mode)

Если renderer получит доступ к Node.js, зловредный код сможет:
- Читать любые файлы на диске
- Удалять файлы
- Запускать произвольные команды
- Доступаться к сети без ограничений

## Защитные механизмы

### 1. Sandbox (`sandbox: true`)

```ts
// src/platform/windows/electron-main/windows-main-service.ts
new BrowserWindow({
  webPreferences: {
    sandbox: true,  // ← Renderer работает как обычная web-страница
  },
});
```

Что делает sandbox:
- Renderer не имеет доступа к Node.js API (`fs`, `child_process`, `path`)
- Renderer не может вызывать `require()`
- Renderer работает в отдельном процессе с ограниченными правами

### 2. Context Isolation (`contextIsolation: true`)

```ts
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,  // ← Preload и renderer изолированы
  },
});
```

Что делает context isolation:
- JavaScript preload script выполняется в **отдельном** контексте
- Renderer не может напрямую получить переменные из preload
- Только `contextBridge.exposeInMainWorld()` пробрасывает API

```
Preload Context          Renderer Context
┌──────────────┐         ┌──────────────┐
│ require()    │         │              │
│ ipcRenderer  │ ──────> │ window.app   │
│ process.env  │         │              │
└──────────────┘         └──────────────┘
       ↑                        ↑
   (Node.js)               (Browser)
```

### 3. Node Integration Off (`nodeIntegration: false`)

```ts
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,  // ← Renderer не видит Node.js
  },
});
```

### 4. Preload Script — минимальный API

Preload — единственный скрипт с привилегиями Node.js. Он экспонирует **минимальный** API:

```ts
// src/preload/preload.ts
const api = {
  // Только send/on
  ipcSend(channel: string, ...args: any[]): void,
  ipcOn(channel: string, listener: (...args: any[]) => void): () => void,
};

contextBridge.exposeInMainWorld("app", api);
```

Renderer не видит:
- Полный `ipcRenderer` (нет `invoke`, `removeAllListeners`)
- `process.env`
- `require()`
- `fs`, `path`, `child_process`

### 5. Валидация IPC каналов

В preload можно добавить валидацию:

```ts
const api = {
  ipcSend(channel: string, ...args: any[]): void {
    // Только каналы с префиксом app: разрешены
    if (!channel.startsWith("app:")) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    ipcRenderer.send(channel, ...args);
  },
};
```

### 6. Блокировка навигации

```ts
// src/main/app.ts
app.on("web-contents-created", (_event, contents) => {
  contents.on("will-navigate", (event, url) => {
    // Блокируем навигацию на внешние URL
    if (new URL(url).protocol !== "file:") {
      event.preventDefault();
    }
  });
});
```

Это предотвращает:
- Открытие фишинговых сайтов
- Уход с доверенной страницы
- Navigation-based XSS

### 7. Блокировка новых окон

```ts
contents.setWindowOpenHandler(({ url }) => {
  // Открываем только разрешённые URL в системном браузере
  if (allowedOrigins.has(new URL(url).origin)) {
    shell.openExternal(url);
  }
  return { action: "deny" };  // Запрещаем создание нового окна
});
```

### 8. CSP (Content Security Policy)

В production renderer HTML должен содержать:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';">
```

Это запрещает:
- Выполнение inline JavaScript (кроме разрешённого)
- Загрузку ресурсов с других доменов
- `eval()` и `new Function()`

## Что делать, если нужен доступ к OS из renderer

**Правило:** Никогда не давайте renderer прямой доступ. Всегда используйте IPC.

### Пример: нужно прочитать файл

❌ **Неправильно:**
```ts
// Renderer
import { readFileSync } from "fs";  // ← ОШИБКА! Нет доступа
```

✅ **Правильно:**
```ts
// 1. Создаём сервис в main
// src/platform/files/electron-main/filesService.ts
export class FilesService {
  async readFile(path: string): Promise<string> {
    return readFileSync(path, "utf-8");
  }
}

// 2. Регистрируем канал в app.ts
server.registerChannel("files", ProxyChannel.fromService(filesService));

// 3. Используем в renderer через IPC
const filesService = ProxyChannel.toService<IFilesService>(
  main-process-service.getChannel("files")
);
const content = await filesService.readFile("/path/to/file");
```

## Preload script безопасность

### Что можно делать в preload

✅ **Разрешено:**
- `require('electron')` для получения `ipcRenderer`, `contextBridge`
- `contextBridge.exposeInMainWorld()` для пробрасывания API
- Валидация входных данных
- Пересылка `MessagePort`

### Чего избегать в preload

❌ **Не рекомендуется:**
- Сложная бизнес-логика
- Прямой доступ к файловой системе
- Выполнение ненадёжного кода
- Передача полного `ipcRenderer` в renderer

❌ **Опасно:**
```ts
// НЕ ДЕЛАЙТЕ ТАК
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: require("electron").ipcRenderer,  // ← Полный доступ!
  process: process,                                // ← Вся информация!
});
```

## Обновление зависимостей

Регулярно обновляйте Electron:
```bash
pnpm update electron
```

Electron содержит Chromium, который регулярно получает security patches.

## Где находятся настройки безопасности

| Файл | Что настраивает |
|------|----------------|
| `src/main/app.ts` | `configureSession()` — блокировка навигации, window open handler |
| `src/platform/windows/electron-main/windows-main-service.ts` | `sandbox`, `contextIsolation`, `nodeIntegration` |
| `src/preload/preload.ts` | Минимальный API через `contextBridge` |
| `vite.preload.config.ts` | CJS формат preload (sandbox-compatible) |

## Проверка безопасности

При добавлении новой функциональности спрашивайте себя:

1. **Этот код выполняется в renderer?** Если да, у него нет доступа к Node.js
2. **Я передаю данные через IPC?** Валидируйте всё, что приходит от renderer
3. **Я добавил новый канал в preload?** Убедитесь, что он начинается с `app:`
4. **Я открываю внешний URL?** Используйте `shell.openExternal`, а не `window.open`
5. **Я загружаю сторонний скрипт?** CSP должен его блокировать
