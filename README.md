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
| `npm run dev` | Run the app in development mode |
| `npm run build` | Build the application |
| `npm run compile` | Build + create distributable (auto-detect OS) |
| `npm run compile:mac` | Build macOS `.dmg` |
| `npm run compile:win` | Build Windows `.exe` |
| `npm run compile:linux` | Build Linux `.deb` + `.AppImage` |
| `npm run lint` | Run ESLint |
| `npm run version` | Generate CHANGELOG.md |

## Architecture

Atlas follows a modular, service-oriented architecture inspired by VS Code.
The app uses a custom Dependency Injection system extracted from VS Code's
codebase, providing decorator-based service registration, lazy instantiation,
and cyclic dependency detection.

The renderer is built with Vue 3 and communicates with the Electron main process
through a preload bridge.

### Key Concepts

- **Command System** — register and execute named commands with keybindings
- **Context Keys** — contextual key-value state for conditional keybinding resolution
- **Keybinding Pipeline** — scan codes, keyboard layout detection, resolved keybindings
- **ModuleRunner** — modular Electron main process initialization

## Project Structure

| Directory | Description |
|---|---|
| `src/ui` | Vue 3 renderer process (UI, components, composables) |
| `src/main` | Electron main process |
| `src/preload` | Electron preload script (contextBridge) |
| `src/core` | Core business logic, services, and DI system |
| `src/platform` | Platform-specific abstractions and utilities |

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
