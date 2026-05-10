# Atlas — Документация архитектуры

Эта документация описывает архитектуру приложения Atlas — кроссплатформенного файлового менеджера, построенного на Electron, Vue 3 и TypeScript с архитектурой, вдохновлённой VS Code.

## Содержание

1. **[Общий обзор](overview.md)** — что это за приложение и из чего оно состоит
2. **[Процессы](processes.md)** — Main, Renderer, Shared Process, Preload. Кто за что отвечает
3. **[Система DI](dependency-injection.md)** — как работает внедрение зависимостей
4. **[IPC коммуникация](ipc.md)** — как процессы общаются друг с другом
5. **[Платформенные сервисы](platform-services.md)** — организация и структура сервисов
6. **[Build система](build.md)** — сборка, dev mode, конфигурация
7. **[Структура проекта](structure.md)** — директории, naming conventions, алиасы
8. **[Безопасность](security.md)** — sandbox, contextIsolation, preload, защита renderer

## Быстрый старт для разработчика

```bash
# Установка зависимостей
pnpm install

# Dev mode (запускает renderer dev server + watch для main/preload/shared)
pnpm dev

# Production build
pnpm build

# Только main process
pnpm build:main

# Только preload
pnpm build:preload

# Только shared process
pnpm build:shared

# Только renderer
pnpm build:renderer
```

## Если что-то непонятно

- **Как добавить новый сервис?** → [Платформенные сервисы](platform-services.md)
- **Как процессы общаются?** → [IPC коммуникация](ipc.md)
- **Где писать код для main/renderer?** → [Структура проекта](structure.md)
- **Почему preload на CJS?** → [Безопасность](security.md)
- **Как собрать проект?** → [Build система](build.md)
