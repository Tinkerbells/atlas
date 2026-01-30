# Atlas

A cross-platform file manager built as a learning project to practice OOP principles
(SOLID, GRASP) and design patterns. Inspired by VSCode's architecture and approach
to extensibility.

## Tech Stack

- Angular v21.0.3
- Electron v39.2.5
- TypeScript
- SASS

## Setup

```bash
pnpm install
```

## Scripts

- `pnpm dev` — run the app in development
- `pnpm start` — preview the built app
- `pnpm build` — typecheck + build
- `pnpm build:win` — build for Windows
- `pnpm build:mac` — build for macOS
- `pnpm build:linux` — build for Linux
- `pnpm build:unpack` — build unpacked artifacts
- `pnpm lint` — run ESLint
- `pnpm lint:fix` — run ESLint with fixes
- `pnpm format` — format with Prettier
- `pnpm typecheck` — run TS checks for web and node

## Features

- Cross-platform file management (Windows, macOS, Linux)
- VSCode-inspired architecture and UI
- Extensible plugin system
- Modern, responsive interface
- Keyboard shortcuts
- Dark theme support

## Project Structure

| Folder | Description                                      |
|--------|--------------------------------------------------|
| app    | Electron main process folder (NodeJS)            |
| src    | Electron renderer process folder (Web / Angular) |

## License

MIT
