# Слой работы с файловой системой (File System Layer)

Слой работы с файловой системой — один из ключевых платформенных сервисов Atlas. Он отвечает за все операции с файлами и директориями: чтение, запись, копирование, перемещение, удаление, наблюдение за изменениями и разрешение метаданных.

Архитектура полностью скопирована с **Visual Studio Code** (`./vscode/src/vs/platform/files`) и основана на паттерне **File System Provider**.

## Содержание

- [Общая архитектура](#общая-архитектура)
- [Провайдерная модель](#провайдерная-модель)
- [Ключевые интерфейсы](#ключевые-интерфейсы)
- [Реализации](#реализации)
- [Базовые утилиты](#базовые-утилиты)
- [Регистрация в DI](#регистрация-в-di)
- [IPC и межпроцессное взаимодействие](#ipc-и-межпроцессное-взаимодействие)
- [Поддерживаемые операции](#поддерживаемые-операции)
- [Референсы](#референсы)

---

## Общая архитектура

В отличие от прямого вызова `fs.promises`, слой файловой системы Atlas использует **провайдерную абстракцию**. Это позволяет:

- Поддерживать разные схемы URI (`file://`, `memfs://`, `ftp://` и т.д.)
- Заменять реализацию файловой системы в тестах
- Проксировать операции через IPC без изменения клиентского кода
- Добавлять кросс-платформенную логику (атомарная запись, блокировки ресурсов, retry)

```
┌─────────────────────────────────────────────────────────────┐
│                    IFileService                              │
│  (единый API для всех процессов)                             │
│                                                              │
│  resolve(), readFile(), writeFile(), move(), copy(), del()   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ делегирует по scheme
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              IFileSystemProvider                             │
│  (провайдер для конкретной схемы)                            │
│                                                              │
│  stat(), readFile(), writeFile(), readdir(), mkdir()         │
│  open(), read(), write(), close()                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
   ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
   │ DiskFileSystem  │ │ MemFS        │ │ RemoteFS     │
   │ Provider        │ │ Provider     │ │ Provider     │
   │ (file://)       │ │ (memfs://)   │ │ (ftp://)     │
   └─────────────────┘ └──────────────┘ └──────────────┘
```

## Провайдерная модель

### Почему Provider, а не прямой fs

Старый `FileService` Atlas (~80 строк) напрямую вызывал `fs.promises.readFile()`, `fs.promises.readdir()` и т.д. Это работало только для локальных файлов и не давало:

- Атомарной записи (atomic write)
- Потокового чтения/записи с backpressure
- Блокировок ресурсов (resource locks)
- Возможности подменить FS в тестах
- Поддержки виртуальных файловых систем

Провайдерная модель VS Code решает все эти проблемы.

### Регистрация провайдера

Провайдер регистрируется по **схеме URI**:

```ts
// src/main/app.ts
import { DiskFileSystemProvider } from "@platform/files/node/disk-file-system-provider";

instantiationService.invokeFunction(accessor => {
  const fileService = accessor.get(IFileService);
  fileService.registerProvider("file", new DiskFileSystemProvider());
});
```

Теперь все операции с `URI.file('/path')` (scheme = `"file"`) будут делегироваться `DiskFileSystemProvider`.

---

## Ключевые интерфейсы

### IFileService

Единый API для работы с файлами во всех процессах. Определён в `src/platform/files/common/files.ts`.

```ts
export interface IFileService {
  readonly _serviceBrand: undefined;

  // События
  readonly onDidChangeFileSystemProviderRegistrations: Event<IFileSystemProviderRegistrationEvent>;
  readonly onDidChangeFileSystemProviderCapabilities: Event<IFileSystemProviderCapabilitiesChangeEvent>;
  readonly onWillActivateFileSystemProvider: Event<IFileSystemProviderActivationEvent>;
  readonly onDidFilesChange: Event<FileChangesEvent>;
  readonly onDidRunOperation: Event<IFileOperationEvent>;
  readonly onDidWatchError: Event<Error>;

  // Регистрация и активация провайдера
  registerProvider(scheme: string, provider: IFileSystemProvider): IDisposable;
  getProvider(scheme: string): IFileSystemProvider | undefined;
  activateProvider(scheme: string): Promise<void>;
  canHandleResource(resource: URI): Promise<boolean>;
  hasProvider(resource: URI): boolean;
  hasCapability(resource: URI, capability: FileSystemProviderCapabilities): boolean;

  // Метаданные
  resolve(resource: URI, options?: IResolveFileOptions): Promise<IFileStat>;
  resolveAll(toResolve: { resource: URI; options?: IResolveFileOptions }[]): Promise<IFileStatResult[]>;
  stat(resource: URI): Promise<IFileStatWithPartialMetadata>;
  realpath(resource: URI): Promise<URI | undefined>;
  exists(resource: URI): Promise<boolean>;

  // Чтение
  readFile(resource: URI, options?: IReadFileOptions, token?: CancellationToken): Promise<IFileContent>;
  readFileStream(resource: URI, options?: IReadFileStreamOptions, token?: CancellationToken): Promise<IFileStreamContent>;

  // Запись
  writeFile(
    resource: URI,
    bufferOrReadableOrStream: VSBuffer | VSBufferReadable | VSBufferReadableStream,
    options?: IWriteFileOptions
  ): Promise<IFileStatWithMetadata>;

  // Операции
  move(source: URI, target: URI, overwrite?: boolean): Promise<IFileStatWithMetadata>;
  canMove(source: URI, target: URI, overwrite?: boolean): Promise<Error | true>;
  copy(source: URI, target: URI, overwrite?: boolean): Promise<IFileStatWithMetadata>;
  canCopy(source: URI, target: URI, overwrite?: boolean): Promise<Error | true>;
  cloneFile(source: URI, target: URI): Promise<void>;

  del(resource: URI, options?: Partial<IFileDeleteOptions>): Promise<void>;
  canDelete(resource: URI, options?: Partial<IFileDeleteOptions>): Promise<Error | true>;

  createFile(resource: URI, bufferOrReadableOrStream?: VSBuffer | VSBufferReadable | VSBufferReadableStream, options?: ICreateFileOptions): Promise<IFileStatWithMetadata>;
  canCreateFile(resource: URI, options?: ICreateFileOptions): Promise<Error | true>;
  createFolder(resource: URI): Promise<IFileStatWithMetadata>;

  // Наблюдение
  watch(resource: URI, options?: IWatchOptionsWithoutCorrelation): IDisposable;
  createWatcher(resource: URI, options: IWatchOptionsWithoutCorrelation & { recursive: false }): IFileSystemWatcher;

  dispose(): void;
}
```

### IFileSystemProvider

Низкоуровневый интерфейс провайдера. Каждый провайдер реализует только те возможности, которые поддерживает.

```ts
export interface IFileSystemProvider {
  readonly capabilities: FileSystemProviderCapabilities;
  readonly onDidChangeCapabilities: Event<void>;
  readonly onDidChangeFile: Event<readonly IFileChange[]>;
  readonly onDidWatchError?: Event<string>;

  stat(resource: URI): Promise<IStat>;
  mkdir(resource: URI): Promise<void>;
  readdir(resource: URI): Promise<[string, FileType][]>;
  delete(resource: URI, opts: IFileDeleteOptions): Promise<void>;
  rename(from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void>;

  // Опциональные возможности (через capability flags)
  readFile?(resource: URI): Promise<Uint8Array>;
  writeFile?(resource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void>;
  readFileStream?(resource: URI, opts: IFileReadStreamOptions, token: CancellationToken): ReadableStreamEvents<Uint8Array>;
  open?(resource: URI, opts: IFileOpenOptions): Promise<number>;
  close?(fd: number): Promise<void>;
  read?(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
  write?(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
  copy?(from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void>;
  cloneFile?(from: URI, to: URI): Promise<void>;
  realpath?(resource: URI): Promise<string>;
}
```

### Capability-интерфейсы

Для type-safe проверки возможностей провайдера используются отдельные интерфейсы:

| Интерфейс | Флаг | Что добавляет |
|-----------|------|---------------|
| `IFileSystemProviderWithFileReadWriteCapability` | `FileReadWrite` | `readFile`, `writeFile` |
| `IFileSystemProviderWithOpenReadWriteCloseCapability` | `FileOpenReadWriteClose` | `open`, `close`, `read`, `write` |
| `IFileSystemProviderWithFileReadStreamCapability` | `FileReadStream` | `readFileStream` |
| `IFileSystemProviderWithFileFolderCopyCapability` | `FileFolderCopy` | `copy` |
| `IFileSystemProviderWithFileAtomicWriteCapability` | `FileAtomicWrite` | Атомарная запись |
| `IFileSystemProviderWithFileAtomicReadCapability` | `FileAtomicRead` | Атомарное чтение |
| `IFileSystemProviderWithFileCloneCapability` | `FileClone` | Клонирование файлов (CoW) |
| `IFileSystemProviderWithFileRealpathCapability` | `FileRealpath` | `realpath` |

Проверка через type guards:

```ts
if (hasReadWriteCapability(provider)) {
  await provider.readFile(resource); // тип narrowing сработает
}
```

---

## Реализации

### FileService

**Файл:** `src/platform/files/node/file-service.ts`

Центральный сервис, реализующий `IFileService`. Работает в **main process** и **shared process**.

Ключевые особенности:
- Конструктор требует `ILogger` для логирования операций
- Хранит Map провайдеров по scheme
- Делегирует операции провайдеру
- Реализует сложные операции через комбинацию простых (`copy` через `readFile` + `writeFile`, если провайдер не поддерживает нативный `copy`)
- Управляет очередями записи/чтения (`ResourceQueue`)
- Генерирует события `FileOperationEvent` и `FileChangesEvent`
- Поддерживает etag для оптимистичной конкурентности
- Использует `extUri.isEqualOrParent` вместо `TernarySearchTree` для проверки `resolveTo`

```ts
export class FileService extends Disposable implements IFileService {
  private readonly provider = new Map<string, IFileSystemProvider>();
  private readonly writeQueues = new ResourceQueue();

  registerProvider(scheme: string, provider: IFileSystemProvider): IDisposable {
    // ...
  }

  async readFile(resource: URI, options?: IReadFileOptions): Promise<IFileContent> {
    const provider = await this.withProvider(resource);
    // выбирает оптимальный путь: readFile, open/read/close, или readFileStream
  }
}
```

### DiskFileSystemProvider

**Файл:** `src/platform/files/node/disk-file-system-provider.ts`

Провайдер для локальной файловой системы (Node.js `fs`). Реализует все capability-интерфейсы.

Ключевые особенности:
- Прямые вызовы `fs.promises` через обёртку `pfs.ts`
- **Resource locks**: `Barrier`-блокировки на URI для предотвращения race conditions
- **Атомарная запись**: запись во временный файл + `rename()`
- **Потоковый I/O**: `open()`/`read()`/`write()`/`close()` для больших файлов, реализован через `readFileIntoStream` из `io.ts`
- **Обработка symlink**: `SymlinkSupport.stat()` отделяет символические ссылки
- **Retry-логика**: при `EBUSY`, `EAGAIN` и т.д.
- **Case sensitivity**: определяет `PathCaseSensitive` capability по платформе
- **Наблюдение (watch)**: пока не реализовано, возвращает no-op disposable

```ts
export class DiskFileSystemProvider implements
  IFileSystemProvider,
  IFileSystemProviderWithFileReadWriteCapability,
  IFileSystemProviderWithOpenReadWriteCloseCapability,
  IFileSystemProviderWithFileReadStreamCapability,
  IFileSystemProviderWithFileFolderCopyCapability,
  IFileSystemProviderWithFileAtomicReadCapability,
  IFileSystemProviderWithFileAtomicWriteCapability,
  IFileSystemProviderWithFileCloneCapability,
  IFileSystemProviderWithFileRealpathCapability
{
  private readonly resourceLocks = new ResourceMap<Barrier>();

  async writeFile(resource: URI, content: Uint8Array, opts?: IFileAtomicWriteOptions): Promise<void> {
    // Если atomic.postfix задан — пишем во временный файл и делаем rename
    // Иначе — открываем fd, пишем, закрываем
  }
}
```

### IO Helpers

**Файл:** `src/platform/files/node/io.ts`

Утилиты для потокового чтения файлов через провайдер с `open/read/close` capability:

```ts
export interface ICreateReadStreamOptions extends IFileReadStreamOptions {
  readonly bufferSize: number;
  readonly errorTransformer?: IErrorTransformer;
}

export async function readFileIntoStream<T>(
  provider: IFileSystemProviderWithOpenReadWriteCloseCapability,
  resource: URI,
  target: WriteableStream<T>,
  transformer: IDataTransformer<VSBuffer, T>,
  options: ICreateReadStreamOptions,
  token: CancellationToken
): Promise<void>;
```

Используется `DiskFileSystemProvider.readFileStream()` для chunked-чтения с контролем `limits.size` (FILE_TOO_LARGE).

### PFS (Promise FS)

**Файл:** `src/platform/files/node/pfs.ts`

Обёртка над `fs.promises` с расширенной функциональностью:

- `Promises.exists()` — проверка существования без исключений
- `Promises.copy()` — рекурсивное копирование с сохранением symlink
- `Promises.rm()` — удаление с поддержкой `RimRafMode` (unlink, rimraf, recursively)
- `SymlinkSupport.stat()` — возвращает `{ stat, symbolicLink }`
- `IDirent` — расширенный интерфейс для `readdir`

---

## Базовые утилиты

Для работы файлового слоя были созданы (или адаптированы) следующие базовые модули:

### VSBuffer

**Файл:** `src/core/base/buffer.ts`

Аналог `Uint8Array` из VS Code. Обеспечивает кросс-процессную сериализацию бинарных данных.

```ts
export class VSBuffer {
  static fromString(source: string, options?: { dontUseNodeBuffer?: boolean }): VSBuffer;
  static wrap(actual: Uint8Array): VSBuffer;
  toString(): string;
  slice(start?: number, end?: number): VSBuffer;
  // ...
}
```

Вспомогательные функции:
- `bufferToStream(buffer)` — оборачивает `VSBuffer` в `ReadableStream<VSBuffer>`
- `streamToBufferReadableStream(stream)` — конвертирует `ReadableStreamEvents<Uint8Array | string>` (например, `fs.createReadStream`) в `ReadableStream<VSBuffer>`
- `bufferToReadable(buffer)` — оборачивает `VSBuffer` в `VSBufferReadable`
- `streamToBuffer(stream)` — потребляет поток и возвращает `VSBuffer`
- `newWriteableBufferStream(options?)` — создаёт записываемый поток `VSBuffer`

Также включает типы:
- `VSBufferReadable` — итератор чанков
- `VSBufferReadableStream` — поток чанков
- `VSBufferReadableBufferedStream` — буферизованный поток

### Streams

**Файл:** `src/core/base/stream.ts`

Утилиты для работы с потоками данных:

- `ReadableStream<T>`, `WriteableStream<T>`
- `newWriteableStream<T>(reducer)` — создание записываемого потока
- `listenStream<T>(stream, listener)` — подписка на данные
- `peekStream<T>(stream, maxChunks)` — предпросмотр чанков без потери
- `peekReadable<T>(readable, reducer, maxChunks)` — предпросмотр readable
- `transform<Original, Transformed>(stream, transformer, reducer)` — трансформация потока

### Cancellation

**Файл:** `src/core/base/cancellation.ts`

Механизм отмены длительных операций:

```ts
export interface CancellationToken {
  readonly isCancellationRequested: boolean;
  readonly onCancellationRequested: Event<any>;
}

export class CancellationTokenSource {
  get token(): CancellationToken;
  cancel(): void;
  dispose(): void;
}
```

### ResourceQueue и Barrier

**Файл:** `src/core/base/async-queue.ts`

- `ResourceQueue` — очередь операций по ключу (URI). Гарантирует, что операции над одним ресурсом не выполняются параллельно. Использует событие `onDrained` для автоочистки очередей (раньше был баг: очередь удалялась после первой задачи вместо полного опустошения).
- `Barrier` — примитив синхронизации. `open()` разрешает ожидающим, `wait()` блокирует до открытия.
- `Queue`/`Limiter` — ограничение concurrency.
- `retry<T>(task, delay, retries)` — повторные попытки с exponential backoff.

### Resources (URI helpers)

**Файл:** `src/core/base/resources.ts`

Утилиты для работы с URI, адаптированные из VS Code:

- `extUri` — операции над URI с учётом case sensitivity
- `joinPath(resource, ...paths)` — аналог `path.join` для URI
- `dirname(resource)`, `basename(resource)` — аналоги `path.dirname`/`basename`
- `isEqual(a, b)` — сравнение URI

---

## Регистрация в DI

### Main Process

**Файл:** `src/main/app.ts`

```ts
import { IFileService } from "@platform/files/common/files";
import { FileService } from "@platform/files/node/file-service";
import { DiskFileSystemProvider } from "@platform/files/node/disk-file-system-provider";

private async initServices(): Promise<IInstantiationService> {
  const services = new ServiceCollection();
  services.set(IFileService, new SyncDescriptor(FileService));
  // ...

  const instantiationService = this.mainInstantiationService.createChild(services, this._store);

  // Регистрируем провайдер для file://
  instantiationService.invokeFunction(accessor => {
    const fileService = accessor.get(IFileService);
    fileService.registerProvider("file", new DiskFileSystemProvider());
  });

  return instantiationService;
}
```

### Shared Process

**Файл:** `src/shared-process/shared-process-main.ts`

Аналогичная регистрация, так как shared process тоже работает с файлами (индексация, поиск).

### Renderer Process

**Файл:** `src/renderer/main.ts`

Renderer не создаёт `FileService` напрямую, а использует **прокси** через IPC:

```ts
import { IFileService } from "@platform/files/common/files";

services.set(
  IFileService,
  ProxyChannel.toService<IFileService>(mainProcessService.getChannel("fileService"))
);
```

Все вызовы `fileService.readFile()` в renderer прозрачно маршалируются в main process через `ProxyChannel`.

---

## IPC и межпроцессное взаимодействие

### Main → Renderer

В `app.ts` сервис публикуется как IPC-канал:

```ts
private initChannels(accessor: ServicesAccessor, electronIpcServer: ElectronIPCServer): void {
  const fileService = accessor.get(IFileService);
  const fileServiceChannel = ProxyChannel.fromService(fileService);
  electronIpcServer.registerChannel("fileService", fileServiceChannel);
}
```

### Renderer → Main

Renderer получает прокси-объект, который выглядит как настоящий `IFileService`:

```ts
// В Vue компоненте
import { IFileService } from "@platform/files/common/files";
import { useService } from "@renderer/composables/use-service";

const fileService = useService(IFileService);

async function loadFile() {
  const content = await fileService.readFile(resource);
  console.log(content.value.toString());
}
```

### Shared Process

Shared process получает свой собственный экземпляр `FileService` с собственным `DiskFileSystemProvider`, так как он работает как отдельный `utilityProcess`.

---

## Поддерживаемые операции

### Чтение

| Метод | Описание | Провайдерные методы |
|-------|----------|---------------------|
| `resolve()` | Получить метаданные + дети директории | `stat()`, `readdir()` |
| `stat()` | Только метаданные | `stat()` |
| `exists()` | Проверка существования | `stat()` |
| `readFile()` | Прочитать файл целиком | `readFile()` или `open/read/close` |
| `readFileStream()` | Прочитать файл потоком | `readFileStream()` или `open/read/close` |
| `realpath()` | Разрешить символические ссылки | `realpath()` |

### Запись

| Метод | Описание | Особенности |
|-------|----------|-------------|
| `writeFile()` | Записать файл | Атомарная запись, unlock, append |
| `createFile()` | Создать новый файл | Проверка существования |
| `createFolder()` | Создать директорию | Рекурсивно |

### Операции

| Метод | Описание | Провайдерные методы |
|-------|----------|---------------------|
| `move()` | Переместить/переименовать | `rename()` или copy+del |
| `copy()` | Копировать | `copy()` или read+write |
| `cloneFile()` | Клонировать (CoW) | `cloneFile()` или copy |
| `del()` | Удалить | `delete()` |

### Наблюдение

| Метод | Описание |
|-------|----------|
| `watch()` | Наблюдать за изменениями в ресурсе |
| `createWatcher()` | Создать watcher с корреляцией |

### События

| Событие | Когда срабатывает |
|---------|-------------------|
| `onDidFilesChange` | Изменились файлы (через провайдер) |
| `onDidRunOperation` | Выполнена файловая операция (move, copy, delete, write) |
| `onDidWatchError` | Ошибка в файловом наблюдателе |

---

## Референсы

### VS Code источники

Архитектура и код адаптированы из следующих файлов VS Code:

| Atlas файл | VS Code источник | Описание |
|-----------|------------------|----------|
| `src/platform/files/common/files.ts` | `./vscode/src/vs/platform/files/common/files.ts` | Интерфейсы `IFileService`, `IFileSystemProvider`, типы, события |
| `src/platform/files/node/file-service.ts` | `./vscode/src/vs/platform/files/common/fileService.ts` | Реализация `FileService` с очередями и провайдерной моделью |
| `src/platform/files/node/disk-file-system-provider.ts` | `./vscode/src/vs/platform/files/node/diskFileSystemProvider.ts` | Node.js провайдер с atomic write, resource locks, streaming |
| `src/platform/files/node/io.ts` | `./vscode/src/vs/platform/files/common/io.ts` | `readFileIntoStream` — потоковое чтение через open/read/close |
| `src/platform/files/node/pfs.ts` | `./vscode/src/vs/base/node/pfs.ts` | Promise-обёртки над `fs` с `SymlinkSupport` |
| `src/core/base/buffer.ts` | `./vscode/src/vs/base/common/buffer.ts` | `VSBuffer`, `streamToBufferReadableStream`, потоковые типы |
| `src/core/base/stream.ts` | `./vscode/src/vs/base/common/stream.ts` | `ReadableStream`, `WriteableStream`, `listenStream`, `peekStream`, `transform` |
| `src/core/base/cancellation.ts` | `./vscode/src/vs/base/common/cancellation.ts` | `CancellationToken`, `CancellationTokenSource` |
| `src/core/base/resources.ts` | `./vscode/src/vs/base/common/resources.ts` | `extUri`, `joinPath`, `dirname`, `isEqualOrParent` для URI |
| `src/core/base/async-queue.ts` | `./vscode/src/vs/base/common/async.ts` | `ResourceQueue` (с `onDrained` событием), `Barrier`, `Queue`, `Limiter` |

### Основные отличия от VS Code

1. **`ILogger` вместо `ILogService`** — конструктор `FileService` принимает `ILogger`, а не VS Code `ILogService`
2. **Нет `localize`** — весь UI-текст захардкожен на английском (`localize` — no-op stub)
3. **`TernarySearchTree` заменён на `extUri.isEqualOrParent`** — в `doResolveFile` для проверки `resolveTo` используется линейный скан вместо trie. Для типичных случаев (несколько `resolveTo`) разница незаметна
4. **`streamToBufferReadableStream` добавлен в `@core/base/buffer`** — конвертирует Node.js `fs.createReadStream` в `ReadableStream<VSBuffer>`
5. **`readFileIntoStream` вынесен в `io.ts`** — `DiskFileSystemProvider` делегирует потоковое чтение `io.ts`, который корректно обрабатывает `limits.size` (FILE_TOO_LARGE)
6. **`ResourceQueue` использует `onDrained` событие** — исправлен критический баг: раньше очередь автоудалялась после первой задачи, теряя последующие
7. **`useUnknownInCatchVariables: false`** — для совместимости с VS Code-стилем catch-блоков
8. **`DiskFileSystemProvider.watch()` — stub** — полноценное файловое наблюдение пока не реализовано
9. **Нет `Iterable.map`** — `listCapabilities()` реализован как generator function
10. **Нет `mark`** — performance marks не используются

## Быстрый старт

### 1. Регистрация в DI

```ts
// src/main/app.ts
import { IFileService } from "@platform/files/common/files";
import { FileService } from "@platform/files/node/file-service";
import { DiskFileSystemProvider } from "@platform/files/node/disk-file-system-provider";

const services = new ServiceCollection();
services.set(IFileService, new SyncDescriptor(FileService, []));

const instantiationService = ...;
instantiationService.invokeFunction(accessor => {
  const fileService = accessor.get(IFileService);
  fileService.registerProvider("file", new DiskFileSystemProvider());
});
```

### 2. Чтение файла целиком

```ts
import { IFileService } from "@platform/files/common/files";
import { URI } from "@platform/common/uri/uri";

const fileService = accessor.get(IFileService);
const resource = URI.file("/home/user/document.txt");

const content = await fileService.readFile(resource);
console.log(content.value.toString()); // VSBuffer -> string
```

### 3. Чтение файла потоком

```ts
import { listenStream } from "@core/base/stream";

const streamContent = await fileService.readFileStream(resource);
listenStream(streamContent.value, {
  onData: chunk => console.log("chunk:", chunk.byteLength),
  onError: err => console.error(err),
  onEnd: () => console.log("done"),
});
```

### 4. Запись файла

```ts
import { VSBuffer } from "@core/base/buffer";

await fileService.writeFile(
  URI.file("/home/user/output.txt"),
  VSBuffer.fromString("Hello, World!")
);
```

### 5. Запись из Node.js ReadStream

```ts
import { createReadStream } from "node:fs";
import { streamToBufferReadableStream } from "@core/base/buffer";

const nodeStream = createReadStream("/home/user/source.txt");
const vsBufferStream = streamToBufferReadableStream(nodeStream);

await fileService.writeFile(
  URI.file("/home/user/destination.txt"),
  vsBufferStream
);
```

### 6. Работа с директориями

```ts
// Получить метаданные + детей (не рекурсивно)
const dir = await fileService.resolve(URI.file("/home/user/projects"));
for (const child of dir.children ?? []) {
  console.log(child.name, child.isDirectory ? "dir" : "file");
}

// Рекурсивное разрешение
const deep = await fileService.resolve(URI.file("/home/user/projects"), {
  resolveTo: [URI.file("/home/user/projects/src")],
});

// Создать папку
await fileService.createFolder(URI.file("/home/user/projects/new-folder"));
```

### 7. Копирование и перемещение

```ts
const source = URI.file("/home/user/a.txt");
const target = URI.file("/home/user/b.txt");

// Проверить возможность копирования
const canCopy = await fileService.canCopy(source, target);
if (canCopy === true) {
  await fileService.copy(source, target, true); // overwrite = true
}

// Переместить
await fileService.move(source, target, true);
```

### 8. Удаление

```ts
await fileService.del(URI.file("/home/user/old.txt"), {
  recursive: false,
  useTrash: false,
  atomic: false,
});
```

### 9. Атомарная запись

```ts
// Запись через временный файл с rename
await fileService.writeFile(
  URI.file("/home/user/critical.json"),
  VSBuffer.fromString('{"key": "value"}'),
  { atomic: { postfix: ".tmp" } }
);
```

### 10. Проверка в тестах

```ts
import { FileService } from "@platform/files/node/file-service";
import { DiskFileSystemProvider } from "@platform/files/node/disk-file-system-provider";

const service = new FileService(logger);
service.registerProvider("file", new DiskFileSystemProvider());

const stat = await service.resolve(URI.file("/tmp/test"));
assert.ok(stat.isDirectory);
```

---

## Состояние тестов

| Набор | Всего | Пройдено | Пропущено | Провалено |
|-------|-------|----------|-----------|-----------|
| Интеграционные (`disk-file-service.integration.test.ts`) | 184 | 182 | 2 (Windows symlink) | 0 |
| Юнит (`files.test.ts`) | 6 | 6 | 0 | 0 |

### Связанная документация Atlas

- [Платформенные сервисы](platform-services.md) — как создавать и регистрировать сервисы
- [DI система](dependency-injection.md) — `InstantiationService`, `ServiceCollection`, `SyncDescriptor`
- [IPC коммуникация](ipc.md) — `ProxyChannel`, `ElectronIPCServer`, `ChannelServer`
- [Процессы](processes.md) — Main, Renderer, Shared Process
