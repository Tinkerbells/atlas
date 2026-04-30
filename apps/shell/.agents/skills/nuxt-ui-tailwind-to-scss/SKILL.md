---
name: nuxt-ui-tailwind-to-scss
description: Migrate any Nuxt UI runtime component from ./nuxt-ui into a custom BEM+SCSS component under @src/shared/ui/. Translates Tailwind/TV classes 1-to-1 into scoped SCSS, preserves public API, and auto-creates missing shared composables/styles.
license: MIT
---

# Nuxt UI Tailwind → SCSS Migration Skill

## Purpose

Convert a Nuxt UI component (e.g. `nuxt-ui/src/runtime/components/Input.vue`) into a fully self-contained custom component living at `src/shared/ui/<component-name>/<component-name>.vue` using:

- **BEM** via `useBem()`
- **SCSS** in a separate `component-name.styles.scss`
- **CSS custom properties** for semantic colors/sizes
- **Simplified UI composables** under `src/shared/ui/composables/`

> The migration must be **complete** — if a shared util/composable/style file does not exist yet, create it.

---

## Target Directory Structure

```
src/shared/ui/
├── <component-name>/
│   ├── <component-name>.vue           # migrated component (kebab-case folder + file)
│   ├── <component-name>.styles.scss   # scoped BEM styles
│   └── index.ts                       # export { default as ComponentName }
│
├── composables/
│   ├── use-bem/
│   │   ├── use-bem.ts
│   │   └── index.ts
│   ├── use-component-ui/
│   ├── use-form-field/
│   ├── use-field-group/
│   └── use-component-icons/
│
├── styles/
│   ├── _tokens.scss      # CSS custom properties (semantic colors, sizes)
│   ├── _utils.scss       # reusable utility classes (truncate, spin, sr-only …)
│   ├── _mixins.scss      # SCSS mixins (focus-ring, transition-colors …)
│   └── index.scss        # forwards everything
│
└── utils/
    └── index.ts          # tiny helpers: get, omit, pick, looseToNumber, mergeClasses
```

---

## 1. Analyse the Source

Before writing anything, read **all** of these for the requested component:

1. `nuxt-ui/src/runtime/components/<Component>.vue`
2. `nuxt-ui/src/theme/<component>.ts`  (the Tailwind Variants theme)
3. Any composables it imports from `nuxt-ui/src/runtime/composables/`
4. Any utilities it imports from `nuxt-ui/src/runtime/utils/`

> The theme file is the **most important** — it contains every Tailwind class that must be translated to SCSS.

---

## 2. Script Block Migration Rules

### 2.1 Preserve the public API

Nuxt UI components usually have two `<script>` blocks.

- **First block** (`<script lang="ts">`): keep the `Props`, `Emits`, `Slots` interfaces almost identical.
- **Second block** (`<script setup lang="ts">`): migrate the implementation.

**Changes allowed:**
- Remove Nuxt UI-specific imports (`#build/ui/*`, `#imports`, `tv`, `defu` …).
- Remove any Nuxt UI i18n / locale / RTL imports and replace them with `vue-i18n` (`useI18n`).
- Replace `useAppConfig()` references with plain defaults or CSS custom properties.
- Replace `tv(theme)` calls with simple computed props / BEM classes.
- Keep `useVModel`, `Primitive`, Reka UI imports, `@vueuse/*` helpers exactly as they are.

**Changes NOT allowed:**
- Do not rename props, emits, slots, or exposed refs unless the source uses internal Nuxt UI types that no longer exist.
- Do not drop `data-slot` attributes.

### 2.2 Replace `tv()` / `ui.xxx()` with BEM

**Before (Nuxt UI):**
```vue
<Primitive :class="ui.root({ class: [uiProp?.root, props.class] })">
```

**After (migrated):**
```vue
<script setup lang="ts">
import { useBem } from "@/shared/ui/composables/use-bem";

const b = useBem("input");   // block becomes "input"
</script>

<Primitive :class="[b(), props.class]">
```

For element classes:
```vue
<input :class="b('base')">
<span :class="b('leading')">
```

For modifiers, use the second argument of `b()`:
```vue
<input :class="b('base', { size, variant, color, disabled })">
```

> Only pass modifiers that are actually used in SCSS. Do not pass booleans that result in empty modifier strings.

### 2.3 Remove `useComponentUI` merges

The `ui` prop (`props.ui`) in Nuxt UI allows deep slot overrides via `useComponentUI`. In the migrated component this is **not supported** unless explicitly requested.

Simplify to:
```ts
const uiProp = computed(() => props.ui ?? {})
```
or ignore `uiProp` entirely and apply `props.class` only on the root.

### 2.4 Keep simplified composables

Import these from `@/shared/ui/composables`:

| Nuxt UI composable               | Migrated location                              | Notes |
|----------------------------------|------------------------------------------------|-------|
| `useFormField`                   | `@/shared/ui/composables/use-form-field`       | Returns plain computed props; no form-bus injection required for basic usage. |
| `useFieldGroup`                  | `@/shared/ui/composables/use-field-group`      | Returns `{ orientation, size }` computed. |
| `useComponentIcons`              | `@/shared/ui/composables/use-component-icons`  | Same API, but `loadingIcon` defaults to `lucide:loader-circle`. |
| `useComponentUI`                 | `@/shared/ui/composables/use-component-ui`     | Returns `computed(() => props.ui ?? {})`. |

If any of the above files do **not** exist, scaffold them with the minimal working implementation (see section 8).

---

## 3. Reka UI Primitives Policy

Nuxt UI is built on top of **Reka UI** (formerly Radix Vue). During migration **all Reka UI imports, components, composables, and props must be preserved exactly as they are** in the source component.

**Keep unchanged:**
- `Primitive`, `PrimitiveProps` — wrapper component
- `SelectRoot`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`, `SelectViewport`, `SelectPortal`
- `ListboxRoot`, `ListboxFilter`, `ListboxContent`, `ListboxItem`, `ListboxItemIndicator`, `ListboxGroup`, `ListboxGroupLabel`, `ListboxVirtualizer`
- `AccordionRoot`, `AccordionItem`, `AccordionHeader`, `AccordionTrigger`, `AccordionContent`
- `DialogRoot`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`
- `PopoverRoot`, `PopoverTrigger`, `PopoverPortal`, `PopoverContent`, `PopoverAnchor`, `PopoverArrow`, `PopoverClose`
- `TabsRoot`, `TabsList`, `TabsTrigger`, `TabsContent`
- `TooltipRoot`, `TooltipTrigger`, `TooltipPortal`, `TooltipContent`, `TooltipArrow`, `TooltipProvider`
- `SwitchRoot`, `SwitchThumb`
- `CheckboxRoot`, `CheckboxIndicator`
- `RadioGroupRoot`, `RadioGroupItem`, `RadioGroupIndicator`
- `SliderRoot`, `SliderTrack`, `SliderRange`, `SliderThumb`
- `ComboboxRoot`, `ComboboxInput`, `ComboboxAnchor`, `ComboboxTrigger`, `ComboboxPortal`, `ComboboxContent`, `ComboboxViewport`, `ComboboxGroup`, `ComboboxLabel`, `ComboboxSeparator`, `ComboboxItem`, `ComboboxItemIndicator`, `ComboboxEmpty`
- `useForwardProps`, `useForwardPropsEmits`
- `createContext`, `useId`, `useDateFormatter`, `useLocale`
- Any other Reka UI primitive or composable used by the source component

Do **not** replace Reka UI wrappers with plain HTML elements. The migrated component must remain fully accessible, keyboard-navigable, and functional by keeping the same headless UI primitives.

---

## 4. Template Migration Rules

1. **Keep `data-slot="name"`** on every significant element exactly as in the source.
2. **Replace `:class="ui.slotName(...)"`** with `:class="b('slot-name')"` or `:class="b('slot-name', { mod })"`.
3. **Keep Reka UI primitives** and their props exactly as in the source.
4. **Keep slots** — names, exposed props (`{ ui }` can be kept or simplified to `{}`), and fallback content.
5. **Kebab-case filenames** — the folder and the `.vue` file must match: `input/input.vue`, `command-palette/command-palette.vue`.

---

## 5. i18n / Translations

**CRITICAL — Forbidden patterns:**
- Do **NOT** use Nuxt UI's built-in translation, locale, or RTL/LTR utilities (e.g. `useLocale` from `#build/ui`, any `@nuxt/ui` i18n helpers, RTL/LTR classes, or `useI18n` from `@nuxtjs/i18n`).
- Do **NOT** rely on Nuxt UI's `ui` config / `appConfig` for translations or text direction.
- Do **NOT** copy any translation keys, locale files, or RTL logic from `nuxt-ui/src/runtime/locale/` or similar.

**Mandatory replacement:** All user-facing strings inside migrated components **must be translatable via `vue-i18n`** (Composition API mode) **only**.

### 5.1 Setup in the component

Import `useI18n` at the top of `<script setup>`:

```vue
<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>
```

Use `t()` in the template for every hard-coded label, placeholder, or aria-label:

```vue
<template>
  <input :placeholder="t('input.placeholder')">
  <span :aria-label="t('input.clear')">{{ t('input.clear') }}</span>
</template>
```

### 5.2 Local locale messages (i18n custom block)

Define component-level translations inside a `<i18n>` custom block so that keys are co-located with the component:

```vue
<i18n>
{
  "en": {
    "input": {
      "placeholder": "Type something…",
      "clear": "Clear"
    }
  },
  "ru": {
    "input": {
      "placeholder": "Введите что-нибудь…",
      "clear": "Очистить"
    }
  }
}
</i18n>
```

For Composition API mode you **must** call `useI18n()` with `useScope: 'local'` (or without arguments if the bundler plugin is configured to pick up custom blocks automatically):

```ts
const { t } = useI18n({ useScope: "local" });
```

If the component has no local `<i18n>` block and only needs global keys, use the global scope:

```ts
const { t } = useI18n(); // global scope
```

### 5.3 Dynamic values / interpolation

Pass interpolation values as the second argument to `t()`:

```vue
<template>
  <span>{{ t('input.remaining', { count: 5 }) }}</span>
</template>

<i18n>
{
  "en": {
    "input": {
      "remaining": "{count} characters remaining"
    }
  }
}
</i18n>
```

### 5.4 Pluralization

Use the pipe syntax for pluralization:

```vue
<template>
  <span>{{ t('input.items', itemCount) }}</span>
</template>

<i18n>
{
  "en": {
    "input": {
      "items": "no items | one item | {count} items"
    }
  }
}
</i18n>
```

### 5.5 Rules summary

- Every visible string in the template must use `t()` — no hard-coded text.
- Default English messages must be provided in the `<i18n>` block.
- Prefer **local scope** (`useScope: 'local'`) so that each component owns its keys.
- Keep keys namespaced by the component block name, e.g. `input.placeholder`, `button.loading`, `select.empty`.
- If the original Nuxt UI component uses no translations (only props like `placeholder`), preserve the prop but also provide a sensible default via `t()`:
  ```ts
  const placeholderText = computed(() => props.placeholder || t("input.placeholder"));
  ```

---

## 6. Style Migration (Tailwind → SCSS)

### 6.1 File naming

Create `src/shared/ui/<component-name>/<component-name>.styles.scss`.

Import it inside the component:
```vue
<style scoped lang="scss">
@use "./<component-name>.styles.scss" as *;
</style>
```

Or, if the project build pipeline prefers `@import`:
```vue
<style scoped lang="scss">
@import "./<component-name>.styles.scss";
</style>
```

Use whichever works with the local Vite/SCSS setup; **default to `@use` when possible**.

### 6.2 BEM block name

Use the same kebab-case name passed to `useBem()`.

```scss
// button.styles.scss
.button { /* block */ }
.button__label { /* element */ }
.button__label--size-sm { /* modifier */ }
```

### 6.3 Tailwind utility → SCSS translation table

Translate every Tailwind class found in the theme file(s) into raw CSS.

| Tailwind class | SCSS equivalent |
|----------------|-----------------|
| `relative` | `position: relative;` |
| `absolute` | `position: absolute;` |
| `inset-0` | `top: 0; right: 0; bottom: 0; left: 0;` |
| `inset-y-0` | `top: 0; bottom: 0;` |
| `start-0` / `end-0` | `left: 0;` / `right: 0;` (or `inset-inline-start/end: 0`) |
| `flex` | `display: flex;` |
| `inline-flex` | `display: inline-flex;` |
| `items-center` | `align-items: center;` |
| `justify-center` | `justify-content: center;` |
| `w-full` | `width: 100%;` |
| `h-full` | `height: 100%;` |
| `min-w-0` | `min-width: 0;` |
| `shrink-0` | `flex-shrink: 0;` |
| `truncate` | `@include truncate;` (see `_mixins.scss`) |
| `rounded-md` | `border-radius: 0.375rem;` |
| `rounded-lg` | `border-radius: 0.5rem;` |
| `border-0` | `border: 0;` |
| `ring` | `box-shadow: 0 0 0 1px var(--color-accented);` |
| `ring-inset` | `box-shadow: inset 0 0 0 1px var(--color-accented);` |
| `ring-2` | `box-shadow: 0 0 0 2px …;` |
| `text-xs` | `font-size: 0.75rem; line-height: 1rem;` |
| `text-sm` | `font-size: 0.875rem; line-height: 1.25rem;` |
| `text-base` | `font-size: 1rem; line-height: 1.5rem;` |
| `font-medium` | `font-weight: 500;` |
| `font-semibold` | `font-weight: 600;` |
| `gap-1` | `gap: 0.25rem;` |
| `gap-1.5` | `gap: 0.375rem;` |
| `gap-2` | `gap: 0.5rem;` |
| `p-1` / `px-2` / `py-1` … | `padding: …` (use exact rem values from Tailwind spacing scale) |
| `size-4` | `width: 1rem; height: 1rem;` |
| `size-5` | `width: 1.25rem; height: 1.25rem;` |
| `appearance-none` | `appearance: none;` |
| `transition-colors` | `transition: color 150ms, background-color 150ms, border-color 150ms, box-shadow 150ms;` |
| `disabled:cursor-not-allowed` | `&:disabled, &[aria-disabled="true"] { cursor: not-allowed; }` |
| `disabled:opacity-75` | `&:disabled, &[aria-disabled="true"] { opacity: 0.75; }` |
| `focus:outline-none` | `&:focus { outline: none; }` |
| `focus-visible:ring-2` | `@include focus-ring(2px);` |
| `placeholder:text-dimmed` | `&::placeholder { color: var(--color-dimmed); }` |
| `text-dimmed` | `color: var(--color-dimmed);` |
| `text-default` | `color: var(--color-default);` |
| `text-highlighted` | `color: var(--color-highlighted);` |
| `text-muted` | `color: var(--color-muted);` |
| `text-inverted` | `color: var(--color-inverted);` |
| `bg-default` | `background-color: var(--color-bg-default);` |
| `bg-elevated` | `background-color: var(--color-bg-elevated);` |
| `bg-elevated/50` | `background-color: rgba(var(--color-bg-elevated-rgb), 0.5);` |
| `bg-transparent` | `background-color: transparent;` |
| `hover:bg-elevated` | `&:hover:not(:disabled):not([aria-disabled="true"]) { background-color: var(--color-bg-elevated); }` |
| `active:bg-elevated` | `&:active:not(:disabled):not([aria-disabled="true"]) { … }` |
| `animate-spin` | `@include animate-spin;` |
| `sr-only` | `@include sr-only;` |

### 6.4 Semantic colors → CSS variables

All color classes (`text-default`, `bg-elevated`, `ring-accented`, `text-dimmed`, etc.) must map to CSS custom properties defined in `src/shared/ui/styles/_tokens.scss`.

**If `_tokens.scss` does not exist, create it** with this starter set:

```scss
:root {
  --color-default: #e5e4e7;
  --color-bg-default: #ffffff;
  --color-elevated: #f3f4f6;
  --color-bg-elevated: #f3f4f6;
  --color-bg-elevated-rgb: 243, 244, 246;
  --color-accented: #d1d5db;
  --color-dimmed: #9ca3af;
  --color-highlighted: #111827;
  --color-inverted: #ffffff;
  --color-muted: #6b7280;
  --color-error: #ef4444;
  --color-primary: #3b82f6;
}
```

> Adapt the hex values to the actual project palette when known. The variable **names** must stay identical to the Tailwind semantic tokens so that 1-to-1 translation is mechanical.

### 6.5 Custom utilities → `_utils.scss`

If the source theme contains a Tailwind utility that is not in the table above, add it to `src/shared/ui/styles/_utils.scss` (or `_mixins.scss`) and use the mixin/class in the component SCSS.

Example:
```scss
// _utils.scss
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@mixin sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### 6.6 Variant / compound variant strategy

Nuxt UI themes use `variants`, `compoundVariants`, and `defaultVariants` inside `tv()`.

In SCSS, flatten this hierarchy into **modifier classes** applied by Vue via `b('element', { variant, size, … })`.

**Example — Button sizes:**
```scss
.button {
  display: inline-flex;
  align-items: center;
  border-radius: 0.375rem;
  font-weight: 500;

  &--size-xs { padding: 0.25rem 0.5rem; font-size: 0.75rem; gap: 0.25rem; }
  &--size-sm { padding: 0.375rem 0.625rem; font-size: 0.75rem; gap: 0.375rem; }
  &--size-md { padding: 0.375rem 0.625rem; font-size: 0.875rem; gap: 0.375rem; }
  &--size-lg { padding: 0.5rem 0.75rem; font-size: 0.875rem; gap: 0.5rem; }
  &--size-xl { padding: 0.5rem 0.75rem; font-size: 1rem; gap: 0.5rem; }
}
```

**Example — Button color + variant compound:**
```scss
.button {
  &--color-primary.button--variant-solid {
    background-color: var(--color-primary);
    color: var(--color-inverted);

    &:hover:not(:disabled):not([aria-disabled="true"]) {
      background-color: rgba(var(--color-primary-rgb), 0.75);
    }
  }

  &--color-primary.button--variant-outline {
    color: var(--color-primary);
    box-shadow: inset 0 0 0 1px rgba(var(--color-primary-rgb), 0.5);
  }
}
```

Use **chained BEM modifiers** (`&--color-primary.&--variant-solid`) to replicate `compoundVariants` exactly.

---

## 7. TypeScript Utility Helpers

If `src/shared/ui/utils/index.ts` does not exist, create it with these minimal helpers (copied from Nuxt UI logic but with zero framework deps):

```ts
export function pick<Data extends object, Keys extends keyof Data>(data: Data, keys: Keys[]): Pick<Data, Keys> {
  const result = {} as Pick<Data, Keys>;
  for (const key of keys) result[key] = data[key];
  return result;
}

export function omit<Data extends object, Keys extends keyof Data>(data: Data, keys: Keys[]): Omit<Data, Keys> {
  const result = { ...data };
  for (const key of keys) delete (result as any)[key];
  return result as Omit<Data, Keys>;
}

export function get(object: Record<string, any> | undefined, path: string | (string | number)[], defaultValue?: any): any {
  if (typeof path === "string") {
    path = path.split(".").map((k) => (Number.isNaN(Number(k)) ? k : Number(k)));
  }
  let result: any = object;
  for (const key of path) {
    if (result === undefined || result === null) return defaultValue;
    result = result[key];
  }
  return result !== undefined ? result : defaultValue;
}

export function looseToNumber(val: any): any {
  const n = Number.parseFloat(val);
  return Number.isNaN(n) ? val : n;
}

export function mergeClasses(appConfigClass?: string | string[], propClass?: string): string {
  if (!appConfigClass && !propClass) return "";
  return [...(Array.isArray(appConfigClass) ? appConfigClass : [appConfigClass]), propClass].filter(Boolean).join(" ");
}
```

---

## 8. Minimal Composables Scaffolding

When a Nuxt UI component imports a composable that does not yet live under `src/shared/ui/composables/`, scaffold the file with the **exact minimal API** shown below. Do not add form-bus injection or deep theme merging unless the migrated component explicitly needs it.

### `use-component-icons.ts`
```ts
import { computed, toValue } from "vue";
import type { MaybeRefOrGetter } from "vue";

export interface UseComponentIconsProps {
  icon?: string;
  avatar?: any;
  leading?: boolean;
  leadingIcon?: string;
  trailing?: boolean;
  trailingIcon?: string;
  loading?: boolean;
  loadingIcon?: string;
}

export function useComponentIcons(componentProps: MaybeRefOrGetter<UseComponentIconsProps>) {
  const props = computed(() => toValue(componentProps));

  const isLeading = computed(() =>
    (props.value.icon && props.value.leading) ||
    (props.value.icon && !props.value.trailing) ||
    (props.value.loading && !props.value.trailing) ||
    !!props.value.leadingIcon
  );
  const isTrailing = computed(() =>
    (props.value.icon && props.value.trailing) ||
    (props.value.loading && props.value.trailing) ||
    !!props.value.trailingIcon
  );

  const leadingIconName = computed(() => {
    if (props.value.loading) return props.value.loadingIcon || "lucide:loader-circle";
    return props.value.leadingIcon || props.value.icon;
  });
  const trailingIconName = computed(() => {
    if (props.value.loading && !isLeading.value) return props.value.loadingIcon || "lucide:loader-circle";
    return props.value.trailingIcon || props.value.icon;
  });

  return { isLeading, isTrailing, leadingIconName, trailingIconName };
}
```

### `use-form-field.ts`
```ts
import { computed } from "vue";

interface Props {
  id?: string;
  name?: string;
  size?: string;
  color?: string;
  highlight?: boolean;
  disabled?: boolean;
}

export function useFormField<T extends Props>(props?: T, _opts?: { deferInputValidation?: boolean }) {
  return {
    id: computed(() => props?.id),
    name: computed(() => props?.name),
    size: computed(() => props?.size),
    color: computed(() => props?.color),
    highlight: computed(() => props?.highlight),
    disabled: computed(() => props?.disabled),
    emitFormBlur: () => {},
    emitFormInput: () => {},
    emitFormChange: () => {},
    emitFormFocus: () => {},
    ariaAttrs: computed(() => ({}))
  };
}
```

### `use-field-group.ts`
```ts
import { computed } from "vue";

export function useFieldGroup<T extends { size?: string }>(props: T) {
  return {
    orientation: computed(() => undefined as string | undefined),
    size: computed(() => props?.size)
  };
}
```

### `use-component-ui.ts`
```ts
import { computed } from "vue";

export function useComponentUI(_name: string, props: { ui?: any }) {
  return computed(() => props.ui ?? {});
}
```

---

## 9. Example: Migrating `Input.vue`

### Source files read
- `nuxt-ui/src/runtime/components/Input.vue`
- `nuxt-ui/src/theme/input.ts`

### Created files

#### `src/shared/ui/input/input.vue`
```vue
<script lang="ts">
import type { VNode } from "vue";
import type { InputHTMLAttributes } from "nuxt-ui/src/runtime/types/html"; // keep or copy types locally

export type InputValue = string | number;

export interface InputProps extends Omit<InputHTMLAttributes, "name" | "type" | "placeholder" | "required" | "autocomplete" | "autofocus" | "disabled"> {
  as?: any;
  id?: string;
  name?: string;
  type?: InputHTMLAttributes["type"];
  placeholder?: string;
  color?: "primary" | "neutral" | "error";
  variant?: "outline" | "soft" | "subtle" | "ghost" | "none";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  required?: boolean;
  autocomplete?: InputHTMLAttributes["autocomplete"];
  autofocus?: boolean;
  autofocusDelay?: number;
  disabled?: boolean;
  highlight?: boolean;
  fixed?: boolean;
  modelValue?: InputValue;
  defaultValue?: InputValue;
  class?: any;
  ui?: any;
}

export interface InputEmits {
  "update:modelValue": [value: InputValue];
  blur: [event: FocusEvent];
  change: [event: Event];
}

export interface InputSlots {
  leading?(props: {}): VNode[];
  default?(props: {}): VNode[];
  trailing?(props: {}): VNode[];
}
</script>

<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from "vue";
import { Primitive } from "reka-ui";
import { useVModel } from "@vueuse/core";

import { useBem } from "@/shared/ui/composables/use-bem";
import { useComponentIcons } from "@/shared/ui/composables/use-component-icons";
import { useFormField } from "@/shared/ui/composables/use-form-field";
import { useFieldGroup } from "@/shared/ui/composables/use-field-group";
import { looseToNumber } from "@/shared/ui/utils";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<InputProps>(), {
  type: "text",
  autocomplete: "off",
  autofocusDelay: 0,
  color: "primary",
  variant: "outline",
  size: "md"
});

const emits = defineEmits<InputEmits>();
const slots = defineSlots<InputSlots>();

const modelValue = useVModel(props, "modelValue", emits, { defaultValue: props.defaultValue });

const { size: formFieldSize, color, id, name, highlight, disabled } = useFormField(props, { deferInputValidation: true });
const { orientation, size: fieldGroupSize } = useFieldGroup(props);
const { isLeading, isTrailing, leadingIconName, trailingIconName } = useComponentIcons(props);

const inputSize = computed(() => fieldGroupSize.value || formFieldSize.value || props.size);
const inputColor = computed(() => color.value || props.color);
const inputHighlight = computed(() => highlight.value || props.highlight);

const b = useBem("input");

const inputRef = useTemplateRef<HTMLInputElement>("inputRef");

function updateInput(value: string | null | undefined) {
  if (typeof value === "string") value = value.trim();
  if (props.type === "number") value = looseToNumber(value);
  modelValue.value = (value as any) ?? "";
}

function onInput(event: Event) {
  updateInput((event.target as HTMLInputElement).value);
}

function onChange(event: Event) {
  updateInput((event.target as HTMLInputElement).value);
  emits("change", event);
}

function onBlur(event: FocusEvent) {
  emits("blur", event);
}

onMounted(() => {
  if (props.autofocus) setTimeout(() => inputRef.value?.focus(), props.autofocusDelay);
});

defineExpose({ inputRef });
</script>

<template>
  <Primitive :as="props.as || 'div'" data-slot="root" :class="[b(), props.class]">
    <input
      :id="id"
      ref="inputRef"
      :type="type"
      :value="modelValue"
      :name="name"
      :placeholder="placeholder"
      data-slot="base"
      :class="b('base', { size: inputSize, variant: props.variant, color: inputColor, highlight: inputHighlight, fixed: props.fixed, leading: isLeading || !!slots.leading, trailing: isTrailing || !!slots.trailing, loading: props.loading, type: props.type })
"
      :disabled="disabled"
      :required="required"
      :autocomplete="autocomplete"
      v-bind="$attrs"
      @input="onInput"
      @blur="onBlur"
      @change="onChange"
    >

    <slot />

    <span v-if="isLeading || !!slots.leading" data-slot="leading" :class="b('leading')">
      <slot name="leading">
        <UIcon v-if="isLeading && leadingIconName" :name="leadingIconName" data-slot="leadingIcon" :class="b('leading-icon')" />
      </slot>
    </span>

    <span v-if="isTrailing || !!slots.trailing" data-slot="trailing" :class="b('trailing')">
      <slot name="trailing">
        <UIcon v-if="trailingIconName" :name="trailingIconName" data-slot="trailingIcon" :class="b('trailing-icon')" />
      </slot>
    </span>
  </Primitive>
</template>

<style scoped lang="scss">
@use "./input.styles.scss" as *;
</style>
```

#### `src/shared/ui/input/input.styles.scss`
```scss
@use "../styles/tokens" as *;
@use "../styles/mixins" as *;
@use "../styles/utils" as *;

.input {
  position: relative;
  display: inline-flex;
  align-items: center;

  &__base {
    width: 100%;
    border-radius: 0.375rem;
    border: 0;
    appearance: none;
    background: var(--color-bg-default);
    color: var(--color-highlighted);

    &::placeholder {
      color: var(--color-dimmed);
    }

    &:focus {
      outline: none;
    }

    &:disabled,
    &[aria-disabled="true"] {
      cursor: not-allowed;
      opacity: 0.75;
    }
  }

  &__leading,
  &__trailing {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
  }

  &__leading { left: 0; }
  &__trailing { right: 0; }

  &__leading-icon,
  &__trailing-icon {
    flex-shrink: 0;
    color: var(--color-dimmed);
  }

  // Variant: outline (default)
  &--variant-outline &__base {
    background: var(--color-bg-default);
    box-shadow: inset 0 0 0 1px var(--color-accented);

    &:focus-visible {
      box-shadow: inset 0 0 0 2px var(--color-primary);
    }
  }

  // Variant: soft
  &--variant-soft &__base {
    background: rgba(var(--color-bg-elevated-rgb), 0.5);

    &:hover:not(:disabled):not([aria-disabled="true"]),
    &:focus:not(:disabled):not([aria-disabled="true"]) {
      background: var(--color-bg-elevated);
    }
  }

  // Variant: subtle
  &--variant-subtle &__base {
    background: var(--color-bg-elevated);
    box-shadow: inset 0 0 0 1px var(--color-accented);
  }

  // Variant: ghost
  &--variant-ghost &__base {
    background: transparent;

    &:hover:not(:disabled):not([aria-disabled="true"]),
    &:focus:not(:disabled):not([aria-disabled="true"]) {
      background: var(--color-bg-elevated);
    }
  }

  // Variant: none
  &--variant-none &__base {
    background: transparent;
  }

  // Sizes
  &--size-xs &__base { padding: 0.25rem 0.5rem; font-size: 0.875rem; line-height: 1rem; gap: 0.25rem; }
  &--size-xs &__leading { padding-left: 0.5rem; }
  &--size-xs &__trailing { padding-right: 0.5rem; }
  &--size-xs &__leading-icon,
  &--size-xs &__trailing-icon { width: 1rem; height: 1rem; }

  &--size-sm &__base { padding: 0.375rem 0.625rem; font-size: 0.875rem; line-height: 1rem; gap: 0.375rem; }
  &--size-sm &__leading { padding-left: 0.625rem; }
  &--size-sm &__trailing { padding-right: 0.625rem; }
  &--size-sm &__leading-icon,
  &--size-sm &__trailing-icon { width: 1rem; height: 1rem; }

  &--size-md &__base { padding: 0.375rem 0.625rem; font-size: 1rem; line-height: 1.25rem; gap: 0.375rem; }
  &--size-md &__leading { padding-left: 0.625rem; }
  &--size-md &__trailing { padding-right: 0.625rem; }
  &--size-md &__leading-icon,
  &--size-md &__trailing-icon { width: 1.25rem; height: 1.25rem; }

  &--size-lg &__base { padding: 0.5rem 0.75rem; font-size: 1rem; line-height: 1.25rem; gap: 0.5rem; }
  &--size-lg &__leading { padding-left: 0.75rem; }
  &--size-lg &__trailing { padding-right: 0.75rem; }
  &--size-lg &__leading-icon,
  &--size-lg &__trailing-icon { width: 1.25rem; height: 1.25rem; }

  &--size-xl &__base { padding: 0.5rem 0.75rem; font-size: 1rem; line-height: 1.5rem; gap: 0.5rem; }
  &--size-xl &__leading { padding-left: 0.75rem; }
  &--size-xl &__trailing { padding-right: 0.75rem; }
  &--size-xl &__leading-icon,
  &--size-xl &__trailing-icon { width: 1.5rem; height: 1.5rem; }

  // Leading padding overrides (compound variant)
  &--leading#{&}--size-xs &__base { padding-left: 1.75rem; }
  &--leading#{&}--size-sm &__base { padding-left: 2rem; }
  &--leading#{&}--size-md &__base { padding-left: 2.25rem; }
  &--leading#{&}--size-lg &__base { padding-left: 2.5rem; }
  &--leading#{&}--size-xl &__base { padding-left: 2.75rem; }

  // Trailing padding overrides
  &--trailing#{&}--size-xs &__base { padding-right: 1.75rem; }
  &--trailing#{&}--size-sm &__base { padding-right: 2rem; }
  &--trailing#{&}--size-md &__base { padding-right: 2.25rem; }
  &--trailing#{&}--size-lg &__base { padding-right: 2.5rem; }
  &--trailing#{&}--size-xl &__base { padding-right: 2.75rem; }

  // Loading spin
  &--loading#{&}--leading &__leading-icon { @include animate-spin; }
  &--loading:not(&--leading)#{&}--trailing &__trailing-icon { @include animate-spin; }

  // Fixed mobile text size overrides
  &:not(&--fixed)#{&}--size-xs &__base { @media (min-width: 768px) { font-size: 0.75rem; } }
  &:not(&--fixed)#{&}--size-sm &__base { @media (min-width: 768px) { font-size: 0.75rem; } }
  &:not(&--fixed)#{&}--size-md &__base { @media (min-width: 768px) { font-size: 0.875rem; } }
  &:not(&--fixed)#{&}--size-lg &__base { @media (min-width: 768px) { font-size: 0.875rem; } }
}
```

---

## 10. Final Checklist

Before finishing the migration, verify:

- [ ] Folder + file are kebab-case: `input/input.vue`, `input/input.styles.scss`.
- [ ] Component name in `useBem("...")` matches the folder name.
- [ ] `data-slot` attributes are preserved on every major element.
- [ ] All Tailwind classes from the theme file have a matching SCSS rule.
- [ ] Semantic colors use CSS variables from `_tokens.scss` (create the file if missing).
- [ ] Missing shared composables/utils are created under `src/shared/ui/composables/` or `src/shared/ui/utils/`.
- [ ] Props / Emits / Slots types are preserved.
- [ ] The component exports itself from `src/shared/ui/<name>/index.ts`.
- [ ] `src/shared/ui/composables/index.ts` re-exports the new composable if one was added.
- [ ] All Reka UI primitives (`Primitive`, `SelectRoot`, `ListboxRoot`, etc.) are preserved with their original props.
- [ ] Every user-facing string in the template uses `t()` from `useI18n()`; local `<i18n>` custom block is provided for default English messages.
- [ ] No utility-class framework (Tailwind, UnoCSS, etc.) classes are used for colours, typography, shadows, animations.

---

## 11. Export Index

Always create `src/shared/ui/<component-name>/index.ts`:

```ts
export { default as Input } from "./input.vue";
export type { InputProps, InputEmits, InputSlots, InputValue } from "./input.vue";
```

PascalCase named export; kebab-case file path.
