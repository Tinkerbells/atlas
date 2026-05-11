# Структура проекта и соглашения

## Дерево директорий

```
atlas/
├── docs/                          # Документация
│   ├── README.md
│   ├── overview.md
│   ├── processes.md
│   ├── dependency-injection.md
│   ├── ipc.md
│   ├── platform-services.md
│   ├── build.md
│   ├── structure.md
│   └── security.md
│
├── scripts/                       # Скрипты сборки и dev
│   └── dev.mjs                    # Dev mode orchestrator
│
├── src/                           # Исходный код
│   ├── core/                      # Фундаментальные утилиты
│   │   ├── base/                  # Базовые примитивы
│   │   │   ├── event.ts           # Event / Emitter
│   │   │   ├── lifecycle.ts       # IDisposable / Disposable / DisposableStore
│   │   │   └── ...
│   │   ├── di/                    # Dependency Injection
│   │   │   ├── instantiation.ts   # createDecorator, IInstantiationService
│   │   │   ├── instantiation-service.ts  # DI контейнер
│   │   │   ├── service-collection.ts
│   │   │   ├── descriptors.ts     # SyncDescriptor
│   │   │   ├── extensions.ts      # registerSingleton
│   │   │   ├── graph.ts           # Cycle detection
│   │   │   └── index.ts           # Public exports
│   │   └── ipc/                   # IPC инфраструктура
│   │       ├── ipc.ts             # Интерфейсы
│   │       ├── ipc-server.ts      # ChannelServer
│   │       ├── ipc-client.ts      # ChannelClient
│   │       ├── proxy-channel.ts   # ProxyChannel
│   │       ├── common/
│   │       │   └── ipc.mp.ts      # MessagePortProtocol
│   │       ├── electron-main/
│   │       │   └── ipc.electron.ts   # ElectronIPCServer
│   │       └── electron-browser/
│   │           └── ipc.electron.ts   # ElectronIPCClient
│   │           └── ipc.mp.ts      # MessagePortClient
│   │
│   ├── main/                      # Electron main process
│   │   ├── main.ts                # Точка входа (bootstrap DI)
│   │   ├── app.ts                 # Application (оркестратор)
│   │   └── app-init-config.ts     # Интерфейс конфигурации
│   │
│   ├── preload/                   # Preload script (1 на окно)
│   │   └── preload.ts             # window.app API (CJS)
│   │
│   ├── shared-process/            # Utility process entry
│   │   └── shared-process-main.ts   # ChannelServer через MessagePort
│   │
│   ├── platform/                  # Платформенные сервисы
│   │   ├── commands/
│   │   │   └── renderer/
│   │   ├── context/
│   │   │   └── renderer/
│   │   ├── environment/
│   │   │   └── electron-main/
│   │   ├── keybindings/
│   │   │   └── renderer/
│   │   ├── lifecycle/
│   │   │   ├── common/
│   │   │   └── electron-main/
│   │   ├── logger/
│   │   │   ├── common/
│   │   │   ├── main/
│   │   │   └── renderer/
│   │   ├── native-host/
│   │   │   └── electron-main/
│   │   ├── node-process/
│   │   │   ├── common/
│   │   │   ├── main/
│   │   │   └── renderer/
│   │   ├── product/
│   │   │   └── common/
│   │   ├── shared-process/
│   │   │   └── electron-main/
│   │   ├── update/
│   │   │   └── electron-main/
│   │   └── windows/
│   │       └── electron-main/
│   │
│   └── ui/                        # Renderer UI (Vue 3)
│       ├── main.ts                # Точка входа renderer
│       ├── app.vue                # Корневой компонент
│       ├── injection-keys.ts      # Vue provide/inject ключи
│       ├── composables/           # Vue composables
│       ├── contributions/         # Contribution registry
│       ├── services/              # Renderer-side сервисы
│       │   ├── main-process/
│       │   └── shared-process/
│       └── shared/ui/             # UI компоненты и стили
│
├── buildResources/                # Ресурсы для electron-builder
├── dist/                          # Сборка (gitignored)
│   ├── main/
│   ├── preload/
│   ├── shared-process/
│   └── renderer/
├── todo/                          # Планы и задачи
├── electron-builder.mjs           # Конфигурация упаковки
├── entry.mjs                      # Точка входа Electron
├── package.json
├── tsconfig.json
└── README.md
```

## Naming Conventions (соглашения об именовании)

### Файлы

| Паттерн | Использование | Пример |
|---------|--------------|--------|
| `kebab-case.ts` | Вспомогательные модули, composables | `file-logger.ts`, `use-logger.ts` |
| `camelCase.ts` | Классы-сервисы, утилиты | `windows-main-service.ts`, `proxyChannel.ts` |
| `PascalCase.ts` | Компоненты Vue | `App.vue`, `CommandPalette.vue` |
| `*.test.ts` | Тесты (рядом с исходником) | `ipc-server.test.ts` |
| `*.vue` | Vue SFC компоненты | `app.vue` |

### Классы и интерфейсы

| Паттерн | Пример | Назначение |
|---------|--------|------------|
| `I` + `PascalCase` | `ILogger`, `IWindowsMainService` | Интерфейс сервиса |
| `PascalCase` | `FileLogger`, `LifecycleMainService` | Реализация сервиса |
| `PascalCase` + `Service` | `WindowsMainService` | Сервис (main process) |
| `PascalCase` + `Client` | `LoggerChannelClient` | IPC клиент (renderer) |
| `use` + `PascalCase` | `useLogger`, `useCommands` | Vue composable |

### События

События именуются по шаблону:
- `onDid` + `Глагол` — событие произошло (прошедшее время)
  - `onDidChange`, `onDidCompleteSearch`, `onDidExit`
- `onWill` + `Глагол` — событие вот-вот произойдёт
  - `onWillShutdown`, `onWillNavigate`

### IPC каналы

Каналы именуются в `camelCase` с префиксом `app:`:
- `app:hello` — handshake renderer → main
- `app:message` — IPC сообщения
- `app:init` — инициализация shared process
- `app:requestSharedProcessPort` — запрос MessagePort
- `app:receiveSharedProcessPort` — получение MessagePort

### Service identifiers

Идентификаторы создаются через `createDecorator`:
```ts
export const ILogger = createDecorator<ILogger>("logger");
export const IWindowsMainService = createDecorator<IWindowsMainService>("windows-main-service");
```

Имя в `createDecorator`:
- camelCase
- Уникальное в пределах приложения
- Обычно совпадает с именем интерфейса без `I`

### Папки по процессам

| Папка | Что туда класть |
|-------|----------------|
| `common/` | Только интерфейсы и типы. Никакой реализации, которая зависит от процесса |
| `electron-main/` | Код, использующий `electron` из main process: `BrowserWindow`, `ipcMain`, `app` |
| `main/` | Тоже что и `electron-main/`, но без прямого `import { app }`. Чисто Node.js код |
| `renderer/` | Код, работающий в browser. Может использовать DOM, Vue, но не `electron` напрямую |
| `electron-browser/` | Код в renderer, который зависит от Electron API: `ipcRenderer` (через preload) |

### Глобальные переменные

| Переменная | Где определена | Что содержит |
|------------|---------------|--------------|
| `window.app` | `preload.ts` | API для IPC: `ipcSend`, `ipcOn` |
| `process.env.MODE` | `scripts/dev.mjs` | `"development"` или `"production"` |
| `process.env.VITE_DEV_SERVER_URL` | `scripts/dev.mjs` | URL dev server (только dev) |

## TypeScript aliases (пути)

```json
{
  "paths": {
    "@renderer/*": ["src/renderer/*"],
    "@main/*": ["src/main/*"],
    "@preload/*": ["src/preload/*"],
    "@shared-process/*": ["src/shared-process/*"],
    "@core/*": ["src/core/*"],
    "@platform/*": ["src/platform/*"]
  }
}
```

| Алиас | Куда ведёт | Пример использования |
|-------|-----------|---------------------|
| `@renderer/` | `src/renderer/` | `import { useLogger } from "@renderer/composables/use-logger"` |
| `@main/` | `src/main/` | `import { initApp } from "@main/main"` |
| `@preload/` | `src/preload/` | `import type { AppAPI } from "@preload/preload"` |
| `@shared-process/` | `src/shared-process/` | `import { ChannelServer } from "@shared-process/shared-process-main"` |
| `@core/` | `src/core/` | `import { Event, Emitter } from "@core/base/event"` |
| `@platform/` | `src/platform/` | `import { ILogger } from "@platform/logger/common/logger"` |

## Импорты

### Порядок импортов

```ts
// 1. Node.js built-ins
import { join } from "node:path";

// 2. External dependencies
import { app } from "electron";

// 3. Internal core
import { Event, Emitter } from "@core/base/event";
import { createDecorator } from "@core/di/instantiation";

// 4. Internal platform
import { ILogger } from "@platform/logger/common/logger";

// 5. Internal UI (только в renderer)
import { useLogger } from "@renderer/composables/use-logger";
```

### Разделение типов и runtime

```ts
// Типы — import type
import type { IDisposable } from "@core/base/lifecycle";
import type { IChannel } from "@core/ipc/ipc";

// Runtime — обычный import
import { Disposable } from "@core/base/lifecycle";
import { ChannelClient } from "@core/ipc/ipc-client";
```

## Где писать новый код

### Новый сервис

```
src/platform/<domain>/
├── common/
│   └── <domain>.ts          # Интерфейс + ServiceIdentifier
├── electron-main/
│   └── <domain>Service.ts   # Реализация main
└── renderer/
    └── <domain>-channel-client.ts  # Прокси renderer (опционально)
```

### Новый IPC канал

1. Регистрация в `src/main/app.ts` (`initChannels`)
2. Потребление в `src/renderer/main.ts` (`ProxyChannel.toService`)

### Новый Vue composable

```
src/renderer/composables/use-<name>.ts
```

### Новый компонент Vue

```
src/renderer/components/<PascalCase>.vue
```

### Новый модуль core

```
src/core/<module>/
├── index.ts          # Public API
└── <files>.ts        # Реализация
```
