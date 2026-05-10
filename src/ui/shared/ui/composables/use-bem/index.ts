/**
 * Represents BEM modifiers.
 * Can be a single string, an array of strings, or an object where keys are modifier names
 * and values are truthy/falsy to conditionally apply them. If a value is a string,
 * the string itself is used as the modifier.
 */
type BemMods = string | string[] | Record<string, boolean | string | undefined>;

/**
 * Constructs a standard BEM class string.
 *
 * @param b - The block name.
 * @param e - The element name (optional).
 * @param m - The modifier name (optional).
 * @returns The formatted BEM class name (e.g., `block__element--modifier`).
 */
function getClassName(b: string, e?: string | null, m?: string): string {
  if (e && m) {
    return `${b}__${e}--${m}`;
  }
  if (e) {
    return `${b}__${e}`;
  }
  if (m) {
    return `${b}--${m}`;
  }
  return b;
}

/**
 * Converts a PascalCase, camelCase, or space-separated string to kebab-case.
 *
 * @param s - The string to convert.
 * @returns The kebab-cased string.
 */
function pascalToKebab(s: string): string {
  return s
    .replace(/([A-Z])([A-Z])/g, "$1-$2")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Normalizes various BEM modifier formats into a flat array of valid modifier strings.
 *
 * @param mods - The modifiers to normalize.
 * @returns An array of active string modifiers.
 */
function normalizeMods(mods: BemMods | undefined): string[] {
  if (!mods)
    return [];
  if (typeof mods === "string")
    return [mods];
  if (Array.isArray(mods))
    return mods.filter(Boolean);

  return Object.entries(mods)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => (typeof value === "string" ? `${key}-${value}` : key));
}

/**
 * A utility for generating BEM (Block, Element, Modifier) CSS classes.
 * Automatically converts PascalCase block names to kebab-case and preserves base classes.
 *
 * @param block - The base name of the BEM block (e.g., 'Button' or 'button').
 * @returns A function `b(element?, modifiers?)` to generate class strings.
 *
 * @example
 * const b = useBem('button');
 *
 * // Signatures & Results:
 * b()                     // -> "button" (Block only)
 * b('element')            // -> "button__element" (Block + Element)
 * b({ mod: true })        // -> "button button--mod" (Block + Modifier)
 * b('el', { mod: 1 })     // -> "button__el button__el--mod" (Element + Modifier)
 * b('el', ['m1', 'm2'])   // -> "button__el button__el--m1 button__el--m2" (Multiple Modifiers)
 *
 * @example
 * // ✅ Valid: UI-component with BEM
 * // * // <template>
 * //   <button :class="b({ disabled: isDisabled, size })">
 * //     <span :class="b('icon')">
 * //       <slot name="icon" />
 * //     </span>
 * //     <span :class="b('text')">
 * //       <slot />
 * //     </span>
 * //   </button>
 * // </template>
 * //
 * // <script setup lang="ts">
 * // import { useBem } from "@/shared/bem";
 * //
 * // type Props = { size?: "sm" | "md" | "lg"; isDisabled?: boolean; };
 * // const props = withDefaults(defineProps<Props>(), { size: "md" });
 * // const b = useBem("button");
 * // </script>
 */
export function useBem(block: string) {
  const b = pascalToKebab(block);

  /**
   * Generates a BEM class string based on the provided element and/or modifiers.
   *
   * @param e - The element name OR modifiers for the block if the element is omitted.
   * @param m - The modifiers for the element (only used if `e` is a string).
   * @returns The generated BEM CSS class string.
   */
  return function bem(
    e?: string | null | BemMods,
    m?: BemMods,
  ): string {
    if (!e) {
      return b;
    }

    // Scenario 1: Only modifiers for the block are passed
    if (typeof e !== "string") {
      const mods = normalizeMods(e as BemMods);
      if (mods.length === 0)
        return b;

      return [b, ...mods.map(mod => getClassName(b, null, mod))].join(" ");
    }

    // Scenario 2: Element and (optionally) modifiers are passed
    const element = e;
    const mods = normalizeMods(m);
    const baseElementClass = getClassName(b, element);

    if (mods.length === 0) {
      return baseElementClass;
    }

    return [
      baseElementClass,
      ...mods.map(mod => getClassName(b, element, mod)),
    ].join(" ");
  };
}
