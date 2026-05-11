# План миграции main-процесса на VS Code-архитектуру

## Общая концепция

Перевод `src/main/` с кастомной модульной архитектуры (`ModuleRunner` + `AppModule`) на DI-центричную архитектуру VS Code:
- Тонкий `main.ts` → `Application` через DI
- Все модули становятся DI-сервисами
- IPC-сервер — multi-connection (как `ElectronIPCServer` в VS Code)
- Shared process — через `UtilityProcess` + `MessagePort`
- Preload script — CJS формат для sandboxed renderer

---

## ✅ Фаза 1. Entry Point + Application Class

**Статус:** Завершена

`main.ts` — только bootstrap DI, вся логика в `Application`.

### Новые файлы
- `src/main/app.ts` — класс `Application extends Disposable`
  - Конструктор: `@IInstantiationService`, `@ILogger`, `@ILifecycleMainService`, `@IEnvironmentMainService`
  - `startup()`:
    1. `configureSession()` — security, permissions
    2. `createElectronIPCServer()`
    3. `setupSharedProcess()`
    4. `initServices()` — child DI
    5. `initChannels()`
    6. `openFirstWindow()`
    7. Установка lifecycle фаз

---

## ✅ Фаза 2. LifecycleMainService

**Статус:** Завершена

### Новые файлы
- `src/platform/lifecycle/electron-main/lifecycleMainService.ts`
  - Фазы: `Starting` → `Ready` → `AfterWindowOpen` → `Eventually`
  - События: `onBeforeShutdown`, `onWillShutdown`, `onBeforeCloseWindow`
  - `registerWindow(window)` — перехват `close` с veto
  - `quit(code?)` / `kill(code?)`

- `src/platform/lifecycle/common/lifecycle.ts`
  - `ILifecycleMainService` interface
  - `ShutdownReason`, `LifecycleMainPhase`

---

## ✅ Фаза 3. EnvironmentMainService + корневые сервисы

**Статус:** Завершена

### Новые файлы
- `src/platform/environment/electron-main/environmentMainService.ts`
  - `IEnvironmentMainService` — `userDataPath`, `logsHome`, `appRoot`, `app`

- `src/platform/product/common/productService.ts`
  - `IProductService` — имя, версия

---

## ✅ Фаза 4. IPC Server → Multi-connection

**Статус:** Завершена

### Новые файлы
- `src/core/ipc/electron-main/ipc.electron.ts`
  - `ElectronIPCServer extends Disposable` — слушает `app:hello`, создаёт `ChannelServer` на каждое окно
  - Поддержка `MessagePort` через `createMessageChannel()`

- `src/core/ipc/electron-browser/ipc.electron.ts`
  - `ElectronIPCClient` — отправляет `app:hello`, слушает `app:message`

- `src/core/ipc/proxy-channel.ts`
  - `ProxyChannel.fromService()` / `ProxyChannel.toService()`

### Изменения
- `src/preload/preload.ts`:
  - CJS формат (`require('electron')`)
  - `contextBridge.exposeInMainWorld("app", api)`
  - Каналы: `app:message`, `app:hello`, `app:receiveSharedProcessPort`

- `src/renderer/services/main-process/electron-browser/mainProcessService.ts`
  - `ElectronIPCMainProcessService` — обёртка над `ElectronIPCClient`

---

## ✅ Фаза 5. Сервисы из модулей

**Статус:** Завершена

### Новые файлы
- `src/platform/windows/electron-main/windowsMainService.ts`
- `src/platform/native-host/electron-main/nativeHostMainService.ts`
- `src/platform/update/electron-main/updateService.ts`

### Удалены
- Весь `src/main/modules/`
- `src/main/module-runner.ts`, `app-module.ts`, `module-context.ts`
- `src/main/ipc/electron-ipc-server.ts`

---

## ✅ Фаза 6. Disposable / Lifecycle порядок

**Статус:** Завершена

Все сервисы наследуют `Disposable`. `Application` использует `_register()` для управления ресурсами.

---

## ✅ Фаза 7. Регистрация каналов + Renderer integration

**Статус:** Завершена

Каналы зарегистрированы:
- `logger` → `ProxyChannel.fromService(ILogger)`
- `nodeProcess` → `ProxyChannel.fromService(INodeProcess)`
- `nativeHost` → `ProxyChannel.fromService(INativeHostMainService)`

Renderer использует `ProxyChannel.toService()` для получения прокси-сервисов.

---

## ✅ Фаза 8. Cleanup

**Статус:** Завершена

Старые модули удалены. Код очищен.

---

## ✅ Фаза 9. Shared Process

**Статус:** Завершена

### Build
- `vite.shared.config.ts` — сборка shared process
- `scripts/dev.mjs` — watch для shared process (3 шаг: preload → shared → main)
- `package.json` — `build:shared`

### Runtime
- `src/platform/shared-process/electron-main/sharedProcess.ts`
  - `spawn()` — `utilityProcess.fork()`
  - `connect()` — создаёт `MessageChannelMain`, отправляет `app:init`
  - `createConnection()` — создаёт новый `MessagePort` для renderer

- `src/shared-process/sharedProcessMain.ts`
  - Entry point utility process
  - `ChannelServer` через `MessagePort`
  - Принимает `parentPort.on("message", ...)`

- `src/core/ipc/common/ipc.mp.ts` + `electron-browser/ipc.mp.ts`
  - `MessagePortProtocol` / `MessagePortClient`

- `src/renderer/services/shared-process/electron-browser/sharedProcessService.ts`
  - Renderer запрашивает `MessagePort` через `app:requestSharedProcessPort`
  - Получает прямое соединение с shared process

### Preload
- Пересылает `MessagePort` из main → renderer через `window.postMessage`

---

## Архитектура после миграции

```
main.ts (Electron Main Entry)
├── ServiceCollection (root)
│   ├── IProductService
│   ├── IEnvironmentMainService
│   ├── ILogger -> FileLogger
│   ├── ILifecycleMainService -> LifecycleMainService
│   └── INodeProcess -> NodeProcessService
├── InstantiationService (root, strict)
└── Application (via DI)
    ├── ElectronIPCServer (multi-connection)
    │   └── app:hello → ChannelServer per window
    ├── SharedProcess (utility process)
    │   └── app:init → MessagePort → ChannelServer
    ├── ServiceCollection (child)
    │   ├── IWindowsMainService -> WindowsMainService
    │   ├── INativeHostMainService -> NativeHostMainService
    │   ├── IUpdateService -> UpdateService
    │   └── ...
    └── InstantiationService (child)
        ├── initChannels()
        │   ├── logger → ProxyChannel.fromService
        │   ├── nodeProcess → ProxyChannel.fromService
        │   └── nativeHost → ProxyChannel.fromService
        └── openFirstWindow()
            └── WindowsMainService.open()
                └── BrowserWindow + preload(CJS)
                    └── window.app (contextBridge)
                        └── ElectronIPCClient → app:hello
```

### Preload Script (CJS)
```js
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('app', {
  ipcSend: (channel, ...args) => ipcRenderer.send(channel, ...args),
  ipcOn: (channel, listener) => { ... }
});
```

### IPC Channels
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `app:hello` | Renderer → Main | Handshake при подключении |
| `app:message` | Bidirectional | IPC messages (call/listen) |
| `app:requestSharedProcessPort` | Renderer → Main | Запрос MessagePort для shared process |
| `app:receiveSharedProcessPort` | Main → Renderer | Передача MessagePort |
| `app:createMessageChannel` | Main → Renderer | Создание MessageChannel |
| `app:messageChannelResult` | Renderer → Main | Результат с MessagePort |
| `app:init` | Main → Shared | Инициализация shared process |
| `app:newConnection` | Main → Shared | Новое соединение для renderer |

---

## Порядок выполнения (все фазы завершены)

1. ✅ Фаза 1 (Application class)
2. ✅ Фаза 2 (Lifecycle)
3. ✅ Фаза 3 (Environment)
4. ✅ Фаза 4 (IPC multi-connection)
5. ✅ Фаза 5 (Сервисы из модулей)
6. ✅ Фаза 6 (Disposable)
7. ✅ Фаза 7 (Channels + Renderer)
8. ✅ Фаза 8 (Cleanup)
9. ✅ Фаза 9 (Shared Process)
