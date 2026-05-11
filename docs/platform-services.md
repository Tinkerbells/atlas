# Платформенные сервисы (Platform Services)

Сервисы — это основные строительные блоки приложения. Каждый сервис отвечает за одну область (логирование, окна, команды и т.д.).

## Организация сервисов

Сервисы организованы по **домену** (что делает) и **процессу** (где работает):

```
src/platform/
├── logger/
│   ├── common/
│   │   └── logger.ts          # Интерфейс ILogger (все процессы)
│   ├── main/
│   │   └── file-logger.ts     # Реализация для main (пишет в файл)
│   └── renderer/
│       └── logger-channel-client.ts  # Прокси для renderer (через IPC)
│
├── windows/
│   └── electron-main/
│       └── windows-main-service.ts  # Только main process
│
├── commands/
│   └── renderer/
│       ├── commands.ts        # Реализация для renderer
│       └── commands-service.ts
```

## Папки по процессам

| Папка | Описание | Пример |
|-------|----------|--------|
| `common/` | Интерфейсы и типы. Используются во всех процессах | `ILogger`, `LogContext` |
| `electron-main/` | Реализация для main process | `LifecycleMainService`, `WindowsMainService` |
| `main/` | Альтернативное название для main process реализаций | `FileLogger` |
| `renderer/` | Реализация для renderer process | `CommandRegistry`, `KeybindingService` |
| `electron-browser/` | Renderer-код, зависящий от Electron API | `ElectronIPCClient` |

## Как создать новый сервис

### Шаг 1. Интерфейс в `common/`

```ts
// src/platform/search/common/search.ts
import { createDecorator } from "@core/di/instantiation";
import { Event } from "@core/base/event";

export interface ISearchService {
  readonly _serviceBrand: undefined;
  
  // Методы
  search(query: string, path: string): Promise<SearchResult[]>;
  
  // События (начинаются с on + заглавная)
  onDidCompleteSearch: Event<SearchResult[]>;
}

export const ISearchService = createDecorator<ISearchService>("searchService");

export interface SearchResult {
  file: string;
  line: number;
  text: string;
}
```

### Шаг 2. Реализация для main process

```ts
// src/platform/search/electron-main/searchService.ts
import { Emitter } from "@core/base/event";
import { Disposable } from "@core/base/lifecycle";
import { ISearchService } from "../common/search";

export class SearchService extends Disposable implements ISearchService {
  declare readonly _serviceBrand: undefined;
  
  private readonly _onDidCompleteSearch = this._register(new Emitter<SearchResult[]>());
  readonly onDidCompleteSearch = this._onDidCompleteSearch.event;
  
  async search(query: string, path: string): Promise<SearchResult[]> {
    // логика поиска (ripgrep, etc.)
    const results = await this.doSearch(query, path);
    this._onDidCompleteSearch.fire(results);
    return results;
  }
}
```

### Шаг 3. Регистрация в DI

```ts
// src/main/app.ts
import { ISearchService } from "@platform/search/common/search";
import { SearchService } from "@platform/search/electron-main/searchService";

private async initServices(): Promise<IInstantiationService> {
  const services = new ServiceCollection();
  services.set(ISearchService, new SyncDescriptor(SearchService));
  // ...
}

// И регистрация канала
private initChannels(...) {
  const searchService = accessor.get(ISearchService);
  electronIpcServer.registerChannel("search", ProxyChannel.fromService(searchService));
}
```

### Шаг 4. Использование в renderer

```ts
// src/renderer/main.ts
import { ISearchService } from "@platform/search/common/search";

services.set(ISearchService, ProxyChannel.toService<ISearchService>(
  main-process-service.getChannel("search")
));
```

## Существующие сервисы

### Main Process Services

| Сервис | Файл | Назначение |
|--------|------|------------|
| `ILifecycleMainService` | `lifecycle/electron-main/lifecycle-main-service.ts` | Фазы жизни приложения, shutdown |
| `IWindowsMainService` | `windows/electron-main/windows-main-service.ts` | Создание и управление окнами |
| `INativeHostMainService` | `native-host/electron-main/native-host-main-service.ts` | OS интеграция (shell, диалоги) |
| `IUpdateService` | `update/electron-main/update-service.ts` | Автообновление |
| `ILogger` | `logger/main/file-logger.ts` | Логирование в файл |
| `INodeProcess` | `node-process/main/node-process-service.ts` | Запуск дочерних процессов |
| `IEnvironmentMainService` | `environment/electron-main/environment-main-service.ts` | Пути, конфигурация |
| `IProductService` | `product/common/product-service.ts` | Информация о продукте |

### Renderer Services

| Сервис | Файл | Назначение |
|--------|------|------------|
| `ILogger` | `logger/renderer/logger-channel-client.ts` | Прокси-логгер (через IPC) |
| `INodeProcess` | `node-process/renderer/node-process-channel-client.ts` | Прокси для процессов |
| `ICommandRegistry` | `commands/renderer/commands.ts` | Реестр команд |
| `ICommandService` | `commands/renderer/commands-service.ts` | Выполнение команд |
| `IKeybindingService` | `keybindings/renderer/keybindings.service.ts` | Горячие клавиши |
| `IContextKeyService` | `context/renderer/context-key-service.ts` | Контекстные ключи |

## Жизненный цикл сервиса

### 1. Регистрация

```ts
services.set(ILogger, new SyncDescriptor(FileLogger, [logsHome]));
```

### 2. Создание (lazy)

```ts
// Первый раз кто-то вызывает accessor.get(ILogger)
// InstantiationService создаёт FileLogger
const logger = accessor.get(ILogger);
```

### 3. Использование

```ts
logger.info("Hello");
```

### 4. Освобождение

```ts
// При shutdown или dispose контейнера
logger.dispose(); // если implements IDisposable
```

## Конвенции именования

### Интерфейс
- Начинается с `I` + название сервиса: `ILogger`, `IWindowsMainService`
- Поле `_serviceBrand: undefined` — маркер типа для TypeScript
- События: `on` + глагол в прошедшем/будущем + название: `onDidChange`, `onWillShutdown`

### Идентификатор
- Тот же файл, что и интерфейс
- Создаётся через `createDecorator<T>("serviceName")`
- Имя в camelCase: `"logger"`, `"windows-main-service"`

### Реализация
- Название без `I`: `FileLogger`, `WindowsMainService`
- Наследует `Disposable`, если создаёт ресурсы
- Регистрируется через `SyncDescriptor`

### Канал (для IPC)
- Имя канала = имя сервиса в camelCase: `"logger"`, `"nodeProcess"`
- Регистрируется через `ProxyChannel.fromService(service)`

## Пример: добавление нового сервиса по шагам

Допустим, нужен сервис для работы с буфером обмена.

### Шаг 1. Интерфейс

```ts
// src/platform/clipboard/common/clipboard.ts
export interface IClipboardService {
  readonly _serviceBrand: undefined;
  writeText(text: string): void;
  readText(): Promise<string>;
}

export const IClipboardService = createDecorator<IClipboardService>("clipboard-service");
```

### Шаг 2. Реализация main

```ts
// src/platform/clipboard/electron-main/clipboard-service.ts
import { clipboard } from "electron";
import { IClipboardService } from "../common/clipboard";

export class ClipboardService implements IClipboardService {
  declare readonly _serviceBrand: undefined;
  
  writeText(text: string): void {
    clipboard.writeText(text);
  }
  
  readText(): Promise<string> {
    return Promise.resolve(clipboard.readText());
  }
}
```

### Шаг 3. Регистрация в app.ts

```ts
// src/main/app.ts
import { IClipboardService } from "@platform/clipboard/common/clipboard";
import { ClipboardService } from "@platform/clipboard/electron-main/clipboard-service";

private async initServices(): Promise<IInstantiationService> {
  const services = new ServiceCollection();
  services.set(IClipboardService, new SyncDescriptor(ClipboardService));
  // ...
}

private initChannels(...) {
  const clipboard = accessor.get(IClipboardService);
  electronIpcServer.registerChannel("clipboard", ProxyChannel.fromService(clipboard));
}
```

### Шаг 4. Использование в renderer

```ts
// src/renderer/main.ts
import { IClipboardService } from "@platform/clipboard/common/clipboard";

services.set(IClipboardService, ProxyChannel.toService<IClipboardService>(
  main-process-service.getChannel("clipboard")
));
```

### Шаг 5. Использование в Vue компоненте

```ts
// src/renderer/components/SomeComponent.vue
import { useClipboard } from "@renderer/composables/use-clipboard";

const clipboard = useClipboard();

async function copy() {
  await clipboard.writeText("Hello!");
}
```

## Где находятся сервисы

| Директория | Назначение |
|------------|------------|
| `src/platform/*` | Платформенные сервисы (домен-ориентированные) |
| `src/main/app.ts` | Регистрация main-сервисов |
| `src/renderer/main.ts` | Регистрация renderer-сервисов |
| `src/core/di/` | DI инфраструктура |
