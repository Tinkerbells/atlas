# Agent Instructions for Atlas

This file contains project-specific instructions for AI coding agents working on Atlas.

## Documentation

All architecture documentation lives in `docs/`. Before making changes, read the relevant doc:

- [docs/README.md](docs/README.md) — Documentation index and quick start
- [docs/overview.md](docs/overview.md) — What Atlas is and what it consists of
- [docs/processes.md](docs/processes.md) — Main, Renderer, Shared Process, Preload roles
- [docs/dependency-injection.md](docs/dependency-injection.md) — How the DI system works
- [docs/ipc.md](docs/ipc.md) — How processes communicate (4-layer IPC, ProxyChannel)
- [docs/platform-services.md](docs/platform-services.md) — Service organization and how to add new services
- [docs/build.md](docs/build.md) — Build system, dev mode, 4 bundles (main/preload/shared/renderer)
- [docs/structure.md](docs/structure.md) — Directory structure, naming conventions, import aliases
- [docs/security.md](docs/security.md) — Sandbox, contextIsolation, preload security model

## Styling

**UnoCSS is used ONLY for layout geometry styles and writing Storybook stories — nothing else.**

Config: `uno.config.ts`. Presets: `presetMini` + `presetAttributify`.

### Rules

- UnoCSS utility classes are allowed **only** for layout geometry: spacing (`m-*`, `p-*`), sizing (`w-*`, `h-*`), display (`flex`, `grid`, `block`), positioning (`absolute`, `relative`), border-radius.
- Colors, typography, shadows, animations, gradients — use CSS modules or component styles, **not** UnoCSS.
- Attributify syntax (`bg="..."`, `text="..."`) is allowed only in Storybook stories. In app components — use `class="..."`.
- Use `~` for self-referencing (`border="~ red"`).
- Do not add custom rules/shortcuts to UnoCSS config — use CSS modules instead.
- Do not use `container`, complex animations, gradients, prose classes.
- Dark mode: `class` strategy by default (`dark:...`).
- Attribute conflict resolution prefix: `un-` (e.g., `un-text="red"`).

### Examples (geometry and Storybook only)

```html
<!-- ✅ OK: geometry in components -->
<div class="flex items-center p-4 w-full h-screen absolute top-0">

<!-- ✅ OK: attributify in Storybook stories -->
<div m="2 x-4" p="y-2" border="rounded">

<!-- ❌ NOT OK: styling via UnoCSS outside Storybook -->
<div class="bg-red-500 text-white shadow-lg">
```

## Linting

ESLint config: `eslint.config.js` (flat config format).

Base config: `@antfu/eslint-config` with `type: "lib"`.

### Stylistic Rules

- Indent: **2 spaces**
- Semicolons: **required** (`semi: true`)
- Quotes: **double** (`quotes: "double"`)

### Naming Conventions

- File names: **kebab-case** (enforced by `unicorn/filename-case`)
- Exceptions: `README.md`, `CLAUDE.md`

### Import Sorting

Imports are sorted by line length (`perfectionist/sort-imports`):
- External imports first
- Then internal (`@web/*`, `@/*`)

### Disabled Rules

The following rules are intentionally turned off:

- `ts/explicit-function-return-type` — No need for explicit return types everywhere
- `no-console` — Console logging is allowed (we have a proper logger service, but console is fine for quick debugging)
- `ts/no-duplicate-enum-values` — Duplicate enum values are allowed
- `ts/no-namespace` — Namespaces are allowed
- `ts/no-use-before-define` — Function hoisting is allowed
- `ts/no-redeclare` — Redeclarations are allowed
- `node/prefer-global/process` — `process` global is allowed
- `no-restricted-syntax` — No syntax restrictions
- `import/no-mutable-exports` — Mutable exports are allowed

### Ignored Paths

- `dist/`
- `node_modules/`
- `coverage/`
- `.ruler/`, `.claude/`, `.turbo/`
- `*.md`, `**/docs.md`

## Architecture Naming: Navigator (not Workbench)

Atlas is a **file manager**, not a code editor. We intentionally avoid VS Code's "Workbench" terminology in favor of "Navigator" — a term that reflects exploration and file management rather than document editing.

### Concept Mapping (VS Code → Atlas)

| VS Code Concept | Atlas Concept | Meaning |
|-----------------|---------------|---------|
| Workbench | **Navigator** | The entire UI shell of a window |
| Editor | **Pane** | A view showing files, folders, or preview |
| Editor Group | **Pane Group** | A group of panes with tabs |
| Editor Area | **Content Area** | The main content region |
| Explorer | **Explorer** | File tree (unchanged, standard term) |
| Panel | **Panel** | Bottom/side panels (terminal, details) |
| Sidebar | **Sidebar** | Left/right sidebars |
| Workbench Configuration | **Navigator Configuration** | Window/layout settings |

### Why "Navigator"?

- **Workbench** implies a surface for *creating/editing* — wrong metaphor for a file manager
- **Navigator** implies *exploration, traversal, organization* — correct metaphor
- Understandable by any developer without VS Code background
- Future-proof: supports both Explorer (tree) and Commander (dual-pane) views

### Where Navigator code lives

```
src/renderer/navigator/          # Navigator services and state
src/renderer/components/         # Vue components (Explorer, Commander, etc.)
```

## Dev Quick Reference

```bash
pnpm install      # Install dependencies
pnpm dev          # Dev mode (watch all 4 bundles)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm lint:fix     # ESLint --fix
pnpm typecheck    # TypeScript check
pnpm test         # Vitest
```
