# Semantic Naming Conventions

This document defines the strict semantic naming rules for the **Atlas** codebase. The goal is to make the project structure self-describing: by looking at a filename, you should immediately know whether it contains an instantiable class, a utility module, a type contract, or an entry point — without opening the file.

The conventions are derived from the VS Code/Theia architecture and adapted for an Electron + Vue 3 + TypeScript project.

---

## The Three Cases

| Case             | What it names                                      | Semantic meaning                                                                                   | Examples                                             |
| ---------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **`PascalCase`** | Classes, DI services, Vue components               | _"This is a thing with state/lifecycle; it is instantiated via `new` or rendered as a component."_ | `WindowManager.ts`, `BridgeRouter.ts`, `App.vue`     |
| **`kebab-case`** | Type contracts, utilities, assets, folders         | _"This is static data, a pure helper, a system file, or a folder."_                                | `api-contract.ts`, `path-utils.ts`, `wavy-lines.svg` |
| **`camelCase`**  | Entry points, barrel files, ready-to-use instances | _"This is a script that boots a process, or an exported object you use directly."_                 | `index.ts`, `main.ts`, `env.d.ts`                    |

---

## Layer-by-Layer Rules

### `src/common/` — Infrastructure & DI

- Files that export a **dominant class** → `PascalCase`.
  - `InstantiationService.ts` (class `InstantiationService`)
  - `ServiceCollection.ts` (class `ServiceCollection`)
  - `LinkedList.ts` (class `LinkedList`)
  - `Descriptors.ts` (class `SyncDescriptor`)
  - `Graph.ts` (classes `Graph`, `Node`)
- Files that export **interfaces, type helpers, or factory functions** → `kebab-case`.
  - `instantiation.ts` (interfaces `IInstantiationService`, `ServiceIdentifier`, function `createDecorator`)
  - `extensions.ts` (functions `registerSingleton`, `getSingletonServiceDescriptors`)
  - `lifecycle.ts` (interfaces `IDisposable`, functions `dispose`, classes `DisposableStore`, `Disposable` — mixed, but no single dominant class)
- Barrel files (re-exports) → `camelCase`.
  - `index.ts`

### `src/main/` — Electron Main Process

- Managers and routers are **instantiable services** → `PascalCase`.
  - `LifecycleManager.ts`
  - `WindowManager.ts`
  - `BridgeRouter.ts`
- Barrel files → `camelCase`.
  - `index.ts`

### `src/preload/` — Preload Scripts

- Entry points → `camelCase`.
  - `index.ts`
  - `index.d.ts`

### `src/renderer/` — Vue 3 Frontend

- Vue components → **always** `PascalCase`.
  - `App.vue`
  - `Versions.vue`
- Proxy/utility modules that export a ready-to-use object → `kebab-case`.
  - `bridge-client.ts` (exports `bridge` and `events` — Proxy objects, not classes)
- Entry points → `camelCase`.
  - `main.ts`
  - `env.d.ts`

---

## How to Decide

Use this decision tree when creating a new file:

1. **Is it a Vue component?**
   → `PascalCase.vue`

2. **Does it export a class that is instantiated via `new` or through a DI container (`SyncDescriptor`)?**
   → `PascalCase.ts`

3. **Is it a barrel file (`index.ts`) or a bootstrap script (`main.ts`)?**
   → `camelCase.ts`

4. **Everything else (types, interfaces, pure functions, constants, assets, folders)?**
   → `kebab-case.ts`

---

## Examples in the Current Tree

```text
src/
├── common/
│   ├── bridge/
│   │   └── api-contract.ts          -- kebab: shared type contract
│   ├── di/
│   │   ├── Descriptors.ts           -- Pascal: class SyncDescriptor
│   │   ├── Graph.ts                 -- Pascal: classes Graph & Node
│   │   ├── InstantiationService.ts  -- Pascal: class InstantiationService
│   │   ├── LinkedList.ts            -- Pascal: class LinkedList
│   │   ├── ServiceCollection.ts     -- Pascal: class ServiceCollection
│   │   ├── extensions.ts            -- kebab: helper functions
│   │   ├── instantiation.ts         -- kebab: interfaces & decorators
│   │   └── index.ts                 -- camel: barrel re-exports
│   └── lifecycle/
│       ├── lifecycle.ts             -- kebab: mixed utilities
│       └── index.ts                 -- camel: barrel re-exports
├── main/
│   ├── bridge/
│   │   └── BridgeRouter.ts          -- Pascal: class BridgeRouter
│   ├── lifecycle/
│   │   ├── LifecycleManager.ts      -- Pascal: class LifecycleManager
│   │   └── index.ts                 -- camel: barrel re-exports
│   ├── windows/
│   │   ├── WindowManager.ts         -- Pascal: class WindowManager
│   │   └── index.ts                 -- camel: barrel re-exports
│   └── index.ts                     -- camel: entry point
├── preload/
│   ├── index.d.ts                   -- camel: global type declarations
│   └── index.ts                     -- camel: preload entry point
└── renderer/
    └── src/
        ├── App.vue                  -- Pascal: Vue root component
        ├── bridge/
        │   └── bridge-client.ts    -- kebab: Proxy module (not a class)
        ├── components/
        │   └── Versions.vue         -- Pascal: Vue component
        ├── main.ts                  -- camel: renderer entry point
        └── env.d.ts                 -- camel: Vite env types
```

---

## Enforcing via ESLint (Optional)

You can configure `eslint-plugin-unicorn` with `filename-case` overrides per folder:

```javascript
// eslint.config.mjs
import unicorn from "eslint-plugin-unicorn";

export default [
  {
    files: ["src/**/*.{ts,vue}"],
    plugins: { unicorn },
    rules: {
      "unicorn/filename-case": [
        "error",
        {
          cases: {
            // Default for most files
            kebabCase: true,
            // Allow PascalCase for class/service files and Vue components
            pascalCase: true,
            // Allow camelCase for entry points
            camelCase: true,
          },
        },
      ],
    },
  },
];
```

> **Note:** Because `unicorn/filename-case` only validates against a single regex per file, it cannot enforce the _semantic_ rule ("this folder must be PascalCase for classes"). The semantic convention is team discipline. You can approximate it by adding override blocks for specific directories.

---

## Summary

| Rule                       | Pattern          | Rationale                            |
| -------------------------- | ---------------- | ------------------------------------ |
| Classes & DI services      | `PascalCase.ts`  | Instantiable entities with lifecycle |
| Vue components             | `PascalCase.vue` | Framework convention                 |
| Type contracts & utilities | `kebab-case.ts`  | Static, stateless code               |
| Entry points & barrels     | `camelCase.ts`   | Bootstrapping scripts                |
| Folders                    | `kebab-case`     | Filesystem readability               |
