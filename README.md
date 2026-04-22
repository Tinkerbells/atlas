# Atlas

A cross-platform file manager built as a learning project to practice OOP principles
(SOLID, GRASP) and design patterns. Inspired by VSCode's architecture and approach
to extensibility.

## Tech Stack

- Vue 3
- Vite 8
- Electron 41
- TypeScript 5.9

## Setup

```bash
npm install
```

## Scripts

| Command | Description |
|---|---|
| `npm run electron:dev` | Run the app in development mode |
| `npm run build` | Build all workspaces |
| `npm run compile` | Build + create distributable (auto-detect OS) |
| `npm run compile:mac` | Build macOS `.dmg` |
| `npm run compile:win` | Build Windows `.exe` |
| `npm run compile:linux` | Build Linux `.deb` + `.AppImage` |
| `npm run lint` | Run ESLint across all workspaces |
| `npm run version` | Generate CHANGELOG.md |

## Architecture

Atlas follows a modular, service-oriented architecture inspired by VS Code.
The app uses a custom Dependency Injection system (`@atlas/di`) extracted from
VS Code's codebase, providing decorator-based service registration, lazy
instantiation, and cyclic dependency detection.

The renderer (`@atlas/shell`) is built with Vue 3 and communicates with the
Electron main process (`@atlas/electron-main`) through a preload bridge
(`@atlas/electron-preload`).

### Key Concepts

- **Command System** — register and execute named commands with keybindings
- **Context Keys** — contextual key-value state for conditional keybinding resolution
- **Keybinding Pipeline** — scan codes, keyboard layout detection, resolved keybindings
- **ModuleRunner** — modular Electron main process initialization

## Project Structure

| Package | Description |
|---|---|
| `apps/shell` | Vue 3 renderer process (UI, services, composables) |
| `packages/di` | Dependency Injection system (from VS Code) |
| `packages/shared` | Framework-agnostic shared utilities |
| `packages/electron-main` | Electron main process |
| `packages/electron-preload` | Electron preload script (contextBridge) |
| `packages/electron-versions` | Electron / Chrome / Node version helpers |
| `packages/eslint` | Shared ESLint configuration |

## Development

### Prerequisites

- Node.js >= 22.12.0
- TypeScript >= 5.9.0

### Debugging

Open `.vscode/launch.json` and use the **Application Debug** compound launch
configuration to debug both the main and renderer processes simultaneously.

### Git Hooks

- **commit-msg** — validates commit messages via commitlint (conventional commits)
- **pre-commit** — runs ESLint and typecheck on staged files via lint-staged

## License

MIT
