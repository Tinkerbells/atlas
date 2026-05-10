import type { ComputedRef, InjectionKey } from "vue";

import { computed, defineComponent, inject, provide } from "vue";

interface FieldGroupContext {
  size: string | undefined;
  orientation: string | undefined;
}

export const fieldGroupInjectionKey: InjectionKey<ComputedRef<FieldGroupContext>> = Symbol("field-group");

export function useFieldGroup<T extends { size?: string }>(props: T) {
  const fieldGroup = inject(fieldGroupInjectionKey, undefined);

  return {
    orientation: computed(() => fieldGroup?.value.orientation),
    size: computed(() => props?.size ?? fieldGroup?.value.size),
  };
}

export const FieldGroupReset = defineComponent({
  name: "FieldGroupReset",
  setup(_, { slots }) {
    provide(fieldGroupInjectionKey, computed(() => ({
      size: undefined,
      orientation: undefined,
    })));

    return () => slots.default?.();
  },
});
