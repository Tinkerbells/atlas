import { computed } from "vue";

export function useComponentUI(_name: string, props: { ui?: any }) {
  return computed(() => props.ui ?? {});
}
