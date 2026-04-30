# AGENTS.md — apps/shell

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
<button class="bg-blue-500 text-white font-bold shadow-lg">
```

## Linting and typechecking

- Before committing, run `lint:fix` to auto-format and fix lint issues.
