# VS Code Dependency Injection System

A standalone Dependency Injection (DI) system extracted from VS Code's codebase. This library provides a lightweight, type-safe dependency injection container with support for:

- **Service identification** via decorators
- **Lazy instantiation** with proxy-based delayed creation
- **Hierarchical containers** with parent-child relationships
- **Cyclic dependency detection**
- **Singleton service registration**

## Installation

```bash
npm install @anthropic/di
```

## Quick Start

### 1. Define Service Interfaces

```typescript
import { createDecorator, BrandedService } from '@anthropic/di';

// Create service identifiers
export const ILogService = createDecorator<ILogService>('logService');
export const IDatabaseService = createDecorator<IDatabaseService>('databaseService');

// Define service interfaces
export interface ILogService {
  readonly _serviceBrand: undefined;
  log(message: string): void;
}

export interface IDatabaseService {
  readonly _serviceBrand: undefined;
  query(sql: string): Promise<any[]>;
}
```

### 2. Implement Services

```typescript
import { ILogService, IDatabaseService } from './services';

export class LogService implements ILogService {
  declare readonly _serviceBrand: undefined;
  
  log(message: string): void {
    console.log(message);
  }
}

export class DatabaseService implements IDatabaseService {
  declare readonly _serviceBrand: undefined;
  
  constructor(@ILogService private readonly logService: ILogService) {}
  
  async query(sql: string): Promise<any[]> {
    this.logService.log(`Executing: ${sql}`);
    return [];
  }
}
```

### 3. Create Container and Register Services

```typescript
import { InstantiationService, ServiceCollection, SyncDescriptor } from '@anthropic/di';
import { ILogService, IDatabaseService, LogService, DatabaseService } from './services';

// Create service collection with registrations
const serviceCollection = new ServiceCollection(
  [ILogService, new SyncDescriptor(LogService)],
  [IDatabaseService, new SyncDescriptor(DatabaseService, [], true)] // true = lazy instantiation
);

// Create the container
const instantiationService = new InstantiationService(serviceCollection);

// Get service instance
const db = instantiationService.invokeFunction(accessor => accessor.get(IDatabaseService));
await db.query('SELECT * FROM users');
```

### 4. Using `createInstance` with Constructor Injection

```typescript
import { IInstantiationService } from '@anthropic/di';

class MyController {
  constructor(
    @ILogService private readonly logService: ILogService,
    @IDatabaseService private readonly db: IDatabaseService
  ) {}
  
  async doSomething(): Promise<void> {
    this.logService.log('Doing something');
    await this.db.query('SELECT 1');
  }
}

// Create instance with automatic dependency injection
const controller = instantiationService.createInstance(MyController);
```

### 5. Child Containers

```typescript
import { DisposableStore } from '@anthropic/di';

const store = new DisposableStore();

// Create a child container with additional services
const childServices = new ServiceCollection([ISomeScopedService, new SyncDescriptor(SomeScopedService)]);
const childContainer = instantiationService.createChild(childServices, store);

// Don't forget to dispose when done
store.dispose();
```

## API Reference

### `createDecorator<T>(serviceId: string): ServiceIdentifier<T>`

Creates a service identifier that can be used as a decorator for dependency injection.

### `InstantiationService`

The main DI container. Supports:
- `createInstance(ctor, ...args)` - Creates an instance with injected dependencies
- `invokeFunction(fn, ...args)` - Invokes a function with a service accessor
- `createChild(services)` - Creates a child container
- `dispose()` - Disposes the container and all created services

### `ServiceCollection`

A collection for registering services. Supports:
- `set(id, instanceOrDescriptor)` - Register a service
- `get(id)` - Get a service registration
- `has(id)` - Check if a service is registered

### `SyncDescriptor<T>`

A descriptor for lazy service instantiation:
- `new SyncDescriptor(ctor, staticArguments, supportsDelayedInstantiation)`

### `registerSingleton(id, ctor, instantiationType)`

Registers a singleton service globally.

## License

MIT License - Copyright (c) Microsoft Corporation
