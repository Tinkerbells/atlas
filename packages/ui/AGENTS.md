**AGENTS.md — Solid MD3 UI на базе Varlet**

- **Цель**  
  На основе репо Varlet UI воспроизвести дизайн‑систему Material Design 3 в Solid + CSS Modules, переиспользуя токены, темы и паттерны, но без копирования Vue‑кода.

- **Опорные файлы Varlet**  
  - Темы: `packages/varlet-ui/src/themes/md3-light/index.ts`, `md3-dark/index.ts`, `dark/index.ts`, утилиты `convert.ts`, `toRem.ts`, `toViewport.ts`.  
  - Токены по умолчанию (MD2 light): `packages/varlet-ui/src/styles/common.less`.  
  - Провайдер переменных: `packages/varlet-ui/src/style-provider/index.ts`, `StyleProvider.vue`.  
  - Каркас полей: `packages/varlet-ui/src/field-decorator/*`.  
  - Пример компонента: `packages/varlet-ui/src/input/*`.

- **Архитектура новой библиотеки (Solid)**  
  - Папка на компонент: `src/components/<Name>/index.tsx`, `props.ts`, `styles.module.css`.  
  - Утилиты: `src/utils/namespace.ts` (BEM), `src/utils/styleVars.ts` (format CSS vars).  
  - Темы: `src/themes/md3-light.ts`, `md3-dark.ts`, `index.ts` (экспорт `Themes`).  
  - StyleProvider: компонент `StyleProvider.tsx` + функция `applyStyleVars(styleVars?: Record<string,string>)` вставляет `<style id="style-vars">:root{...}</style>`; `null` удаляет.  
  - Базовые токены в `src/styles/common.css` (плоский `:root` из `md3-light`).

- **Миграция тем**  
  - Сгенерировать плоские объекты из Varlet тем (учесть спреды компонентных файлов) скриптом `scripts/build-themes.ts`.  
  - Экспортировать `Themes.md3Light`, `Themes.md3Dark` и конвертеры `toRem`, `toViewport`, `convert` (адаптация из Varlet).

- **Паттерн FieldDecorator**  
  - Создать `src/components/field-decorator/` в Solid; повторить пропсы (`variant`, `size`, `isFocusing`, `isError`, `disabled`, иконки, hint).  
  - Стили в `field-decorator.module.css`, перенести логику из `field-decorator.less`: позиционирование label, анимация, линии, состояния; все значения — через CSS vars.

- **Input как шаблон**  
  - Solid `Input.tsx` с пропсами Varlet (`value/onChange`, `type`, `textarea`, `clearable`, `errorMessage`, `disabled`, `readonly`, `autosize`, и т.д.).  
  - `input.module.css`: переписать `input.less`, оставить только переменные `--input-*` и `--field-decorator-*`.  
  - Использовать `FieldDecorator` как оболочку.

- **Стили: Less → современный CSS**  
  - Вложенность заменить на нативное CSS Nesting или PostCSS `postcss-nesting`.  
  - Импорты: `@import` / `@layer` в CSS; порядок common → icon → field-decorator → form-details → component.  
  - Добавить расширения `.css` явно; препроцессорные функции не нужны.

- **Theming для пользователя**  
  - По умолчанию применять `md3-light` (`common.css` в `:root`).  
  - Переключение: `applyStyleVars(Themes.md3Dark)` или `<StyleProvider styleVars={Themes.md3Dark}>`.  
  - Кастомизация: `applyStyleVars({ ...Themes.md3Light, '--color-primary': 'rebeccapurple' })`.

- **DX и сборка**  
  - Vite + Solid + PostCSS (опц. `postcss-nesting`, `autoprefixer`).  
  - Сгенерировать `src/themes/types.d.ts` из ключей тем.  
  - Тесты: vitest для утилит; демо‑примеры для визуальной проверки.

- **Лицензия**  
  - Varlet — MIT (`/LICENSE`). Допустимо заимствовать токены/структуру с упоминанием; Vue‑код не копировать дословно.

- **Порядок работы LLM**  
  1) Считать указанные файлы Varlet для референса.  
  2) Сгенерировать темы и общий `common.css`.  
  3) Реализовать `StyleProvider` и утилиты.  
  4) Создать `FieldDecorator`, затем `Input` как эталон.  
  5) Тиражировать паттерн на остальные компоненты.  
  6) Добавить примеры и базовые тесты.

- **Интеграция с headless Ark UI (Solid)**  
  - Логику/поведение брать из Ark UI компонентов, а не реализовывать вручную. Использовать `@ark-ui/solid/<component>` как основу для состояния и а11y.  
  - Паттерн подключения:  
    ```tsx
    import { Dialog } from '@ark-ui/solid/dialog'
    import { Portal } from 'solid-js/web'
    // свой декоративный слой: стили + обёртки
    <Dialog.Root {...props}>
      <Dialog.Trigger class={styles.trigger}>...</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop class={styles.backdrop} />
        <Dialog.Positioner class={styles.positioner}>
          <Dialog.Content class={styles.content}>
            <Dialog.Title class={styles.title}>...</Dialog.Title>
            <Dialog.Description class={styles.desc}>...</Dialog.Description>
            <Dialog.CloseTrigger class={styles.close}>
              <XIcon />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
    ```  
  - UI‑слой (CSS Modules) обязан:  
    - оборачивать/декорировать слоты Ark UI, сохраняя структуру и пропсы;  
    - применять CSS variables из текущей темы (через `StyleProvider`), повторяя визуал Varlet/MD3;  
    - не ломать aria/поведение, заданные Ark UI.  
  - Для input‑подобных использовать свой `FieldDecorator` как внешний каркас, а внутри — элементы Ark UI (`Field`, `Input`, `Textarea`, `Label`, `HelperText` и т.п.).  
  - Если Ark UI не предоставляет нужный подэлемент, только тогда добавить тонкую прослойку логики (но не переизобретать состояние).  
  - Тесты: сравнивать визуал (скриншоты) и проверять, что DOM‑структура/aria от Ark UI остаётся нетронутой.  
  - Документация: в примерах всегда показывать, что логика — из Ark UI, стили — из вашей темы (MD3), чтобы отделить ответственность слоёв.

- **Референс на готовый слой стилей (Park UI)**  
  - Если в Ark UI нет нужного компонента или нужна подсказка по структурной разметке, смотреть в Park UI:  
    - Логика/JSX: `/Users/user/projects/atlas/packages/ui/park-ui/components/solid/src/components/ui/<component>.tsx`  
    - Стайлинг (PandaCSS recipes): `/Users/user/projects/atlas/packages/ui/park-ui/packages/preset/src/recipes/<component>.ts`  
  - Park UI тоже поверх Ark UI, поэтому можно заимствовать разметку слотов и сопоставление состояний. CSS-in-JS там Panda, но полезно увидеть, какие токены и псевдоклассы они накладывают; конвертировать идеи в CSS Modules и ваши MD3 переменные.  
  - Приоритет: сначала Ark UI API, затем Park UI как справочник; не переносить Panda-инфраструктуру, только идеи по слоям/вариантам/стейтам.

- **Storybook требования**  
  - Каждый компонент обязан иметь сторис `*.stories.tsx` (storybook-solidjs-vite) рядом с реализацией.  
  - Сторис должны:  
    - Экспортировать `meta` с `title`, `component`, `tags: ['autodocs']`, `parameters.layout = 'centered'` (или подходящее).  
    - Определять `argTypes`/`args` для всех публичных пропсов (варианты, размеры, состояния).  
    - Давать несколько демонстраций: базовый рендер с args, варианты (variant matrix), размеры, disabled, loading, иконки, группировки и «gallery» для снапшотов.  
  - При использовании Ark UI/FieldDecorator — сторис должны показывать, что логика из Ark UI, стили из вашей темы (MD3).  
  - Пример структуры см. в шаблоне для Button (variants/sizes/disabled/loading/icons/grouped/gallery).

- **Проверки качества**  
  - Регулярно гонять качество: `pnpm lint`, `pnpm lint:fix` (при необходимости автоправки), `pnpm typecheck`.  
  - Перед пушем/PR запускать минимум `pnpm lint` и `pnpm typecheck`; для локальных правок — `pnpm lint:fix` чтобы синхронизировать стиль.  
  - Если добавлены новые компоненты/сторис — убедиться, что проверки проходят без варнингов.
