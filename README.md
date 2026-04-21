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
npm install
```

## Scripts

- `npm dev` — run the app in development
- `npm start` — preview the built app
- `npm build` — typecheck + build
- `npm build:win` — build for Windows
- `npm build:mac` — build for macOS
- `npm build:linux` — build for Linux
- `npm build:unpack` — build unpacked artifacts
- `npm lint` — run ESLint
- `npm lint:fix` — run ESLint with fixes
- `npm format` — format with Prettier
- `npm typecheck` — run TS checks for web and node

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
