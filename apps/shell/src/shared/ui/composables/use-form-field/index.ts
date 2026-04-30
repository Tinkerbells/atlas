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
    ariaAttrs: computed(() => ({})),
  };
}
