# Dependency Injection (DI) в Atlas

DI — это паттерн, при котором объекты не создают свои зависимости сами, а получают их извне. В Atlas DI-система вдохновлена VS Code и позволяет:
- Легко тестировать сервисы (mock зависимостей)
- Заменять реализации (например, логгер в main vs renderer)
- Управлять жизненным циклом сервисов
- Автоматически разрешать зависимости

## Ключевые концепции

### 1. ServiceIdentifier (идентификатор сервиса)

Каждый сервис имеет уникальный идентификатор — декоратор:

```ts
// src/platform/logger/common/logger.ts
export interface ILogger {
  readonly _serviceBrand: undefined;
  info(message: string): void;
  error(message: string): void;
}

// Создаём идентификатор
export const ILogger = createDecorator<ILogger>("logger");
```

`createDecorator` возвращает функцию-декоратор, которую можно использовать на параметрах конструктора:

```ts
class MyService {
  constructor(@ILogger private readonly logger: ILogger) {}
}
```

### 2. ServiceCollection (коллекция сервисов)

Это "рецепт" создания сервисов. Map от `ServiceIdentifier` к реализации:

```ts
const services = new ServiceCollection();

// Вариант 1: прямая инстанция
services.set(IProductService, { nameShort: "Atlas", version: "1.0.0" });

// Вариант 2: ленивый дескриптор (создастся при первом обращении)
services.set(ILogger, new SyncDescriptor(FileLogger, [logsHome]));

// Вариант 3: дескриптор без аргументов
services.set(ILifecycleMainService, new SyncDescriptor(LifecycleMainService));
```

### 3. InstantiationService (DI-контейнер)

Создаёт сервисы, разрешая их зависимости:

```ts
const instantiationService = new InstantiationService(services, true);
// true = strict mode (ошибка, если сервис не найден)
```

### 4. Создание инстанций

```ts
// Через дескриптор (DI сам найдёт зависимости)
const app = instantiationService.createInstance(Application, initConfig);

// Через invokeFunction (получить доступ к сервисам внутри функции)
instantiationService.invokeFunction(accessor => {
  const logger = accessor.get(ILogger);
  const windows = accessor.get(IWindowsMainService);
  logger.info("Windows count: " + windows.getWindowCount());
});
```

## Пример полного цикла

### Шаг 1. Объявляем интерфейс

```ts
// src/platform/update/common/update.ts
export interface IUpdateService {
  readonly _serviceBrand: undefined;
  checkForUpdates(): void;
}

export const IUpdateService = createDecorator<IUpdateService>("update-service");
```

### Шаг 2. Создаём реализацию

```ts
// src/platform/update/electron-main/update-service.ts
export class UpdateService extends Disposable implements IUpdateService {
  declare readonly _serviceBrand: undefined;

  checkForUpdates(): void {
    // логика автообновления
  }
}
```

### Шаг 3. Регистрируем в DI

```ts
// src/main/app.ts
private async initServices(): Promise<IInstantiationService> {
  const services = new ServiceCollection();
  services.set(IUpdateService, new SyncDescriptor(UpdateService));
  return this.mainInstantiationService.createChild(services, this._store);
}
```

### Шаг 4. Используем через DI

```ts
// В другом сервисе
class Application {
  constructor(
    @ILogger private readonly logService: ILogger,
    @IUpdateService private readonly update-service: IUpdateService,
  ) {}

  async startup(): Promise<void> {
    this.logService.info("Starting...");
    this.update-service.checkForUpdates();
  }
}
```

## SyncDescriptor (ленивое создание)

`SyncDescriptor` — это "рецепт" создания сервиса:

```ts
// Создаст FileLogger только при первом обращении к ILogger
services.set(ILogger, new SyncDescriptor(FileLogger, [logsHome]));
```

Параметры:
- `ctor` — конструктор класса
- `staticArguments` — аргументы, которые передаются в конструктор до DI-зависимостей
- `supportsDelayedInstantiation` — если `true`, создаёт Proxy, который инициализируется в idle time

### Delayed Instantiation

```ts
services.set(IKeybindingService, 
  new SyncDescriptor(KeybindingService, [], true)
);
```

С `supportsDelayedInstantiation: true`:
- Создаётся Proxy-объект
- Реальный сервис инициализируется:
  - Либо когда к нему впервые обратятся
  - Либо в "idle time" (когда браузер свободен)
- Полезно для тяжёлых сервисов, которые не нужны сразу

## Child Containers (дочерние контейнеры)

`createChild()` создаёт scoped DI-контейнер:

```ts
// Root container (в main.ts)
const rootServices = new ServiceCollection();
rootServices.set(ILogger, new SyncDescriptor(FileLogger, [logsHome]));
const root = new InstantiationService(rootServices, true);

// Child container (в Application)
const childServices = new ServiceCollection();
childServices.set(IWindowsMainService, new SyncDescriptor(WindowsMainService));

// Child видит все сервисы parent + свои
const child = root.createChild(childServices, this._store);
```

Почему это полезно:
- **Изоляция:** сервисы в child не засоряют root
- **Переопределение:** можно заменить сервис в child, не трогая root
- **Lifecycle:** при dispose child автоматически освобождает все созданные сервисы

## DI в Renderer Process

В renderer DI работает иначе — сервисы приходят через IPC:

```ts
// src/renderer/main.ts
const main-process-service = new ElectronIPCMainProcessService();

const services = new ServiceCollection();

// Прокси-сервис из main process
services.set(ILogger, ProxyChannel.toService<ILogger>(
  main-process-service.getChannel("logger")
));

// Локальные renderer-сервисы
services.set(ICommandRegistry, new SyncDescriptor(CommandRegistry));

const instantiationService = new InstantiationService(services);
```

## Disposable и DI

Когда сервис создаётся через DI, он автоматически отслеживается:

```ts
export class Application extends Disposable {
  private electronIpcServer = this._register(new ElectronIPCServer());
  
  // При dispose Application:
  // 1. Dispose electronIpcServer
  // 2. Dispose всех children из _store
  // 3. Dispose всех сервисов, созданных DI
}
```

## Паттерны использования

### 1. Получить сервис внутри метода

```ts
this.instantiationService.invokeFunction(accessor => {
  const logger = accessor.get(ILogger);
  logger.info("Hello");
});
```

### 2. Создать класс с DI-зависимостями

```ts
const instance = this.instantiationService.createInstance(MyClass, arg1, arg2);
// arg1, arg2 — обычные аргументы
// @ILogger, @ILifecycleMainService — автоматически инжектируются DI
```

### 3. Зарегистрировать singleton (renderer)

```ts
// В импортируемом файле (side-effect)
registerSingleton(ICommandRegistry, CommandRegistry, InstantiationType.Eager);

// Потом собираем все зарегистрированные
const descriptors = getSingletonServiceDescriptors();
for (const [id, descriptor] of descriptors) {
  services.set(id, descriptor);
}
```

## Где находятся файлы DI

| Файл | Назначение |
|------|------------|
| `src/core/di/instantiation.ts` | `createDecorator`, `IInstantiationService`, `ServiceIdentifier` |
| `src/core/di/instantiation-service.ts` | `InstantiationService` — DI контейнер |
| `src/core/di/service-collection.ts` | `ServiceCollection` — map сервисов |
| `src/core/di/descriptors.ts` | `SyncDescriptor` — ленивые дескрипторы |
| `src/core/di/extensions.ts` | `registerSingleton`, `getSingletonServiceDescriptors` |
| `src/core/di/graph.ts` | Граф для detection циклических зависимостей |
