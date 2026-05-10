import type { MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";

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
    (props.value.icon && props.value.leading)
    || (props.value.icon && !props.value.trailing)
    || (props.value.loading && !props.value.trailing)
    || !!props.value.leadingIcon,
  );
  const isTrailing = computed(() =>
    (props.value.icon && props.value.trailing)
    || (props.value.loading && props.value.trailing)
    || !!props.value.trailingIcon,
  );

  const leadingIconName = computed(() => {
    if (props.value.loading)
      return props.value.loadingIcon || "lucide:loader-circle";
    return props.value.leadingIcon || props.value.icon;
  });
  const trailingIconName = computed(() => {
    if (props.value.loading && !isLeading.value)
      return props.value.loadingIcon || "lucide:loader-circle";
    return props.value.trailingIcon || props.value.icon;
  });

  return { isLeading, isTrailing, leadingIconName, trailingIconName };
}
