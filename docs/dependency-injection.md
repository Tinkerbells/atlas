# Dependency Injection System

This project uses a lightweight, decorator-less dependency injection (DI) container extracted from the VS Code codebase. It lives under `src/common/di/` and requires **no `reflect-metadata`**, **no `@injectable()` markers**, and **no experimental TypeScript decorator emit metadata**.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Defining a Service](#defining-a-service)
- [Implementing a Service](#implementing-a-service)
- [Creating the Container](#creating-the-container)
- [Resolving Services](#resolving-services)
- [Child Containers](#child-containers)
- [Lazy Instantiation](#lazy-instantiation)
- [Lifecycle & Disposal](#lifecycle--disposal)
- [Why This System?](#why-this-system)

---

## Overview

The DI system is built around a few lightweight primitives:

| Concept | File | Purpose |
|---|---|---|
| `ServiceIdentifier<T>` | `instantiation.ts` | A typed token used to request a service |
| `createDecorator<T>()` | `instantiation.ts` | Creates a `ServiceIdentifier` that doubles as a parameter decorator |
| `SyncDescriptor<T>` | `Descriptors.ts` | A recipe for constructing a service |
| `ServiceCollection` | `ServiceCollection.ts` | A registry of service identifiers to instances or descriptors |
| `InstantiationService` | `InstantiationService.ts` | The container that resolves dependencies and creates instances |
| `Disposable` / `DisposableStore` | `lifecycle/` | Utilities for managing object lifecycles |

---

## Core Concepts

### Service Identifier

A `ServiceIdentifier<T>` is both a **type token** and a **parameter decorator**. It is created with a unique string:

```typescript
import { createDecorator } from "@/common/di";

export const ILogger = createDecorator<ILogger>("logger");

export interface ILogger {
  readonly _serviceBrand: undefined;
  log: (message: string) => void;
}
```

The `_serviceBrand` property is used for compile-time type branding and can be omitted in practice if you do not need strict branded-service inference.

### SyncDescriptor

A `SyncDescriptor` tells the container **how** to build a service:

```typescript
import { SyncDescriptor } from "@/common/di";

// Eager instantiation (default)
new SyncDescriptor(MyService);

// With static constructor arguments
new SyncDescriptor(MyService, [arg1, arg2]);

// Lazy instantiation via Proxy
new SyncDescriptor(MyService, [], true);
```

---

## Defining a Service

1. Create an interface (optional but recommended).
2. Create a `ServiceIdentifier` with `createDecorator`.

```typescript
// src/common/services/ilogger.ts
import { createDecorator } from "@/common/di";

export const ILogger = createDecorator<ILogger>("logger");

export interface ILogger {
  log: (message: string) => void;
}
```

---

## Implementing a Service

Implementations are plain classes. **You do not need `@injectable()`**. Just use the `ServiceIdentifier` as a parameter decorator in the constructor:

```typescript
// src/main/services/logger.ts
import { ILogger } from "@/common/services/ilogger";

export class ConsoleLogger implements ILogger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}
```

```typescript
import type { WindowManager } from "@/main/windows";

import { IWindowManager } from "@/common/di/types";
// src/main/services/app.ts
import { ILogger } from "@/common/services/ilogger";

export class Application {
  constructor(
    @ILogger private readonly logger: ILogger,
    @IWindowManager private readonly windowManager: WindowManager,
  ) {}

  start(): void {
    this.logger.log("Application starting...");
    // ...
  }
}
```

> **Note:** The `@ILogger` and `@IWindowManager` decorators are the actual `ServiceIdentifier` functions. They record dependency metadata directly on the constructor function. No `reflect-metadata` is required.

---

## Creating the Container

Create a `ServiceCollection`, map identifiers to descriptors, and pass it to an `InstantiationService`:

```typescript
import { WindowManager } from "@/main/windows";
import { ILogger } from "@/common/services/ilogger";
import { LifecycleManager } from "@/main/lifecycle";
import { ConsoleLogger } from "@/main/services/logger";
import { ILifecycleManager, IWindowManager } from "@/common/di/types";
// src/common/di/container.ts
import { InstantiationService, ServiceCollection, SyncDescriptor } from "@/common/di";

const services = new ServiceCollection(
  [ILogger, new SyncDescriptor(ConsoleLogger)],
  [IWindowManager, new SyncDescriptor(WindowManager)],
  [ILifecycleManager, new SyncDescriptor(LifecycleManager)],
);

export const container = new InstantiationService(services);
```

---

## Resolving Services

### Via `invokeFunction`

The preferred way to pull a service out of the container:

```typescript
import { container } from "@/common/di/container";
import { ILogger } from "@/common/services/ilogger";

const logger = container.invokeFunction(accessor => accessor.get(ILogger));
logger.log("Hello from DI!");
```

### Via `createInstance`

Create an instance of a class that has its own decorated dependencies:

```typescript
import { container } from "@/common/di/container";
import { Application } from "@/main/services/app";

const app = container.createInstance(Application);
app.start();
```

The container inspects `Application`'s constructor, sees the `@ILogger` and `@IWindowManager` decorators, resolves them, and injects them automatically.

### Via `SyncDescriptor`

You can also resolve a service by its descriptor:

```typescript
const descriptor = new SyncDescriptor(ConsoleLogger);
const logger = container.createInstance(descriptor);
```

---

## Child Containers

Child containers inherit all services from their parent and can override or extend them:

```typescript
import { DisposableStore } from "@/common/lifecycle";
import { ServiceCollection, SyncDescriptor } from "@/common/di";

const store = new DisposableStore();

const childServices = new ServiceCollection(
  [ILogger, new SyncDescriptor(DebugLogger)], // override parent logger
);

const child = container.createChild(childServices, store);

// Use child container...
const logger = child.invokeFunction(accessor => accessor.get(ILogger));

// Clean up when done
store.dispose();
```

> Passing a `DisposableStore` to `createChild` ensures the child container is disposed when the store is disposed.

---

## Lazy Instantiation

Mark a descriptor with `supportsDelayedInstantiation = true` (third argument) to enable **Proxy-based lazy loading**:

```typescript
new SyncDescriptor(HeavyService, [], true);
```

When this service is injected:

1. The container returns a `Proxy` immediately.
2. The real instance is created on **first property access** or during **idle time** (`requestIdleCallback`).
3. Event listeners (`onDid...`, `onWill...`) are buffered until the real object exists and then replayed.

This is ideal for desktop applications with hundreds of services where startup time matters.

---

## Lifecycle & Disposal

The `Disposable`, `DisposableStore`, and `IDisposable` utilities live in `src/common/lifecycle/`:

```typescript
import { Disposable, DisposableStore, toDisposable } from "@/common/lifecycle";

// Base class with automatic cleanup
class MyService extends Disposable {
  constructor() {
    super();
    const watcher = fs.watch("file.txt", () => {});
    this._register(toDisposable(() => watcher.close()));
  }
}

// Manual collection
const store = new DisposableStore();
store.add(someDisposable);
store.dispose(); // disposes everything in the store
```

`InstantiationService.dispose()` will dispose all services it created that implement `IDisposable`, as well as all child containers.

---

## Why This System?

| Feature | `@atlas/di` | Standard `@inject` DI |
|---|---|---|
| `reflect-metadata` | **Not required** | Usually required |
| `@injectable()` | **Not required** | Usually required |
| `experimentalDecorators` | Optional | Often required |
| Lazy instantiation | **Built-in Proxy** | Manual or absent |
| Startup overhead | Minimal | Higher (metadata scan) |
| Bundle size | ~10 KB core | Often 20–50 KB + reflect-metadata |
| Child containers | Built-in | Built-in in most |

This system is optimized for **Electron/desktop applications** where:
- Cold startup performance matters.
- There are many optional or heavy services.
- You want zero runtime metadata dependencies.

---

## Quick Reference

```typescript
// 1. Declare
export const IMyService = createDecorator<IMyService>("myService");

// 2. Implement
export class MyService implements IMyService {
  constructor(@ILogger private readonly logger: ILogger) {}
}

// 3. Register
const services = new ServiceCollection(
  [IMyService, new SyncDescriptor(MyService)],
);
const container = new InstantiationService(services);

// 4. Resolve
const instance = container.invokeFunction(accessor => accessor.get(IMyService));
```
