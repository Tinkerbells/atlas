# Build система и Dev Mode

Приложение собирается с помощью **Vite** — быстрого сборщика, который использует esbuild для компиляции TypeScript.

## Структура сборки

Приложение состоит из **четырёх** независимых бандлов:

| Бандл | Точка входа | Конфиг | Выход | Формат | Цель |
|-------|------------|--------|-------|--------|------|
| Main | `src/main/main.ts` | `vite.main.config.ts` | `dist/main/main.js` | ESM | Node.js 22 |
| Preload | `src/preload/preload.ts` | `vite.preload.config.ts` | `dist/preload/preload.js` | CJS | Node.js / Electron preload |
| Shared | `src/shared-process/shared-process-main.ts` | `vite.shared.config.ts` | `dist/shared-process/shared-process-main.js` | ESM | Node.js 22 |
| Renderer | `src/ui/main.ts` | `vite.config.ts` | `dist/renderer/` | ESM | Browser (es2023) |

## Зачем 4 отдельных бандла?

Каждый бандл работает в **разном окружении**:

- **Main** — Node.js в Electron main process. Может использовать `require('electron')`, `fs`, `path`
- **Preload** — специальный скрипт Electron. Компилируется в CJS, потому что sandboxed renderer не понимает ESM `import` на этом уровне
- **Shared** — Node.js в Electron utility process. Как main, но без доступа к `BrowserWindow`
- **Renderer** — Browser/V8. Использует Vue 3, работает в sandbox. Не имеет доступа к Node.js API

## Конфигурации

### vite.main.config.ts

```ts
export default defineConfig({
  build: {
    ssr: true,              // Server-side rendering mode (для Node.js)
    target: "node22",       // Целевая версия Node.js
    lib: {
      entry: "src/main/main.ts",
      formats: ["es"],      // ESM для Node.js
    },
    rollupOptions: {
      external: ["electron", "electron-updater", "@vscode/ripgrep"],
    },
  },
});
```

**external** — библиотеки, которые не бандлятся, а импортируются через Node.js:
- `electron` — встроен в Electron runtime
- `electron-updater` — должен загружаться как CJS
- `@vscode/ripgrep` — нативный бинарник

### vite.preload.config.ts

```ts
export default defineConfig({
  build: {
    ssr: false,             // Не SSR
    target: "es2023",
    lib: {
      entry: "src/preload/preload.ts",
      formats: ["cjs"],     // CommonJS для sandboxed renderer!
    },
    rollupOptions: {
      external: ["electron"], // require('electron') — runtime
    },
  },
});
```

**Почему CJS?**
- Preload script выполняется в специальном контексте Electron
- `sandbox: true` означает, что renderer изолирован
- `require('electron')` — это нативный Node.js механизм, который работает в preload
- `import` (ESM) может не работать корректно в этом контексте

### vite.shared.config.ts

Аналогичен main config, но входная точка — `src/shared-process/shared-process-main.ts`.

### vite.config.ts (Renderer)

```ts
export default defineConfig({
  build: {
    target: "es2023",       // Browser target
    // Обычный SPA бандл (не library)
  },
});
```

## Dev Mode (scripts/dev.mjs)

В dev mode запускается цепочка:

```
1. Запускается Vite dev server для renderer (порт 5173)
   └── process.env.VITE_DEV_SERVER_URL = http://localhost:5173/

2. Запускается watch build для preload
   └── dist/preload/preload.js (пересобирается при изменениях)

3. Запускается watch build для shared process
   └── dist/shared-process/shared-process-main.js

4. Запускается watch build для main
   └── dist/main/main.js
   └── После каждой сборки перезапускается Electron
```

### Что происходит при изменении файла

**Изменение в renderer (`src/ui/`):**
- Vite dev server обновляет страницу через HMR (Hot Module Replacement)
- Electron window автоматически получает новый код

**Изменение в preload (`src/preload/`):**
- Пересобирается `dist/preload/preload.js`
- **Нужно перезапустить Electron**, потому что preload загружается один раз при создании окна

**Изменение в main (`src/main/`):**
- Пересобирается `dist/main/main.js`
- Electron перезапускается автоматически

**Изменение в shared (`src/shared-process/`):**
- Пересобирается `dist/shared-process/shared-process-main.js`
- **Нужно перезапустить Electron**, потому что shared process fork'ается при старте

## Entry point (entry.mjs)

Это точка входа для Electron (указана в `package.json` как `"main": "entry.mjs"`):

```js
import { initApp } from "./dist/main/main.js";

initApp({
  // В dev mode: URL от Vite dev server
  renderer: process.env.VITE_DEV_SERVER_URL
    ? new URL(process.env.VITE_DEV_SERVER_URL)
    : { path: join(__dirname, "dist/renderer/index.html") },
  
  // Preload script
  preload: { path: join(__dirname, "dist/preload/preload.js") },
  
  // Shared process entry
  sharedProcess: { path: join(__dirname, "dist/shared-process/shared-process-main.js") },
});
```

## Production Build

```bash
# Полная сборка
pnpm build

# Что происходит:
# 1. build:main     → dist/main/main.js
# 2. build:preload  → dist/preload/preload.js
# 3. build:shared   → dist/shared-process/shared-process-main.js
# 4. build:renderer → dist/renderer/ (HTML + JS + CSS)
```

## Packaging (electron-builder)

```bash
pnpm compile

# Создаёт:
# - macOS: dist/Atlas-1.0.0-mac.dmg
# - Windows: dist/Atlas-1.0.0-win.exe
# - Linux: dist/Atlas-1.0.0-linux.AppImage
```

Конфигурация в `electron-builder.mjs`:
```js
export default {
  appId: 'com.atlas.desktop',
  productName: 'Atlas',
  files: [
    'LICENSE*',
    'entry.mjs',
    'dist/**/*',
  ],
};
```

## Путь к файлам в runtime

### Dev mode

```
project/
├── src/              # Исходники
├── dist/
│   ├── main/main.js
│   ├── preload/preload.js
│   ├── shared-process/shared-process-main.js
│   └── renderer/     # Vite dev server (в памяти)
└── entry.mjs         # Electron entry
```

Renderer загружается с `http://localhost:5173/` (Vite dev server).

### Production

```
Atlas.app/ (или Atlas.exe)
├── entry.mjs
├── dist/
│   ├── main/main.js
│   ├── preload/preload.js
│   ├── shared-process/shared-process-main.js
│   └── renderer/
│       ├── index.html
│       └── assets/
└── node_modules/
```

Renderer загружается из `dist/renderer/index.html`.

## Где находятся конфиги

| Файл | Назначение |
|------|------------|
| `vite.config.ts` | Renderer build |
| `vite.main.config.ts` | Main process build |
| `vite.preload.config.ts` | Preload build (CJS) |
| `vite.shared.config.ts` | Shared process build |
| `scripts/dev.mjs` | Dev mode orchestrator |
| `entry.mjs` | Electron entry point |
| `electron-builder.mjs` | Packaging config |
| `package.json` | Scripts & dependencies |
| `tsconfig.json` | TypeScript config |

## Troubleshooting

### Preload не загружается (Cannot use import statement)

**Причина:** Preload скомпилирован в ESM, а Electron ожидает CJS.

**Решение:**
```ts
// vite.preload.config.ts
lib: {
  formats: ["cjs"],  // ← должно быть CJS
}
```

### Main process не видит renderer

**Причина:** `VITE_DEV_SERVER_URL` не установлен.

**Решение:** Запускать через `pnpm dev`, а не напрямую `electron .`.

### Shared process не запускается

**Причина:** `dist/shared-process/shared-process-main.js` не существует.

**Решение:**
```bash
pnpm build:shared
```

### "Cannot find module 'electron'"

**Причина:** Пытаетесь импортировать `electron` в renderer коде.

**Решение:** В renderer используйте IPC через `window.app`. Electron API доступен только в main/preload/shared.
