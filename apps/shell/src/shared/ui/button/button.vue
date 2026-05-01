<script lang="ts">
import type { VNode } from "vue";
</script>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Primitive } from "reka-ui";
import { Icon } from "~/shared/ui/icon";
import { useBem } from "~/shared/ui/composables/use-bem";
import { useFieldGroup } from "~/shared/ui/composables/use-field-group";
import { useComponentIcons } from "~/shared/ui/composables/use-component-icons";

export interface ButtonProps {
  as?: any;
  label?: string;
  color?: "primary" | "neutral" | "error";
  activeColor?: string;
  variant?: "solid" | "outline" | "soft" | "subtle" | "ghost" | "link";
  activeVariant?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  square?: boolean;
  block?: boolean;
  loading?: boolean;
  loadingAuto?: boolean;
  loadingIcon?: string;
  icon?: string;
  leading?: boolean;
  leadingIcon?: string;
  trailing?: boolean;
  trailingIcon?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  class?: any;
  ui?: any;
  onClick?: ((event: MouseEvent) => void | Promise<void>) | Array<((event: MouseEvent) => void | Promise<void>)>;
}

export interface ButtonEmits {
  click: [event: MouseEvent];
}

export interface ButtonSlots {
  leading?: (props: Record<string, never>) => VNode[];
  default?: (props: Record<string, never>) => VNode[];
  trailing?: (props: Record<string, never>) => VNode[];
}

const props = withDefaults(defineProps<ButtonProps>(), {
  type: "button",
  color: "primary",
  variant: "solid",
  size: "md",
});

defineEmits<ButtonEmits>();
const slots = defineSlots<ButtonSlots>();
const { size: fieldGroupSize } = useFieldGroup(props);
const buttonSize = computed(() => fieldGroupSize.value || props.size);

const loadingAutoState = ref(false);

async function onClickWrapper(event: MouseEvent) {
  if (props.disabled || props.loading)
    return;

  if (props.loadingAuto) {
    loadingAutoState.value = true;
  }

  const callbacks = Array.isArray(props.onClick) ? props.onClick : [props.onClick];

  try {
    await Promise.all(callbacks.map(fn => fn?.(event)));
  }
  finally {
    if (props.loadingAuto) {
      loadingAutoState.value = false;
    }
  }
}

const isLoading = computed(() => props.loading || (props.loadingAuto && loadingAutoState.value));

const { isLeading, isTrailing, leadingIconName, trailingIconName } = useComponentIcons(
  computed(() => ({ ...props, loading: isLoading.value })),
);

const isSquare = computed(() => props.square || (!slots.default && props.label === undefined));

const b = useBem("button");
</script>

<template>
  <Primitive
    :as="as || 'button'" :type="as ? undefined : type" :disabled="disabled || isLoading" data-slot="base"
    :class="[
      b({
        size: buttonSize,
        variant,
        color,
        loading: isLoading,
        block,
        square: isSquare,
        leading: isLeading,
        trailing: isTrailing,
      }),
      props.class,
    ]" @click="onClickWrapper"
  >
    <slot name="leading">
      <Icon
        v-if="isLeading && leadingIconName" :name="leadingIconName" data-slot="leading-icon"
        :class="b('leading-icon')"
      />
    </slot>

    <slot>
      <span v-if="label !== undefined && label !== null" data-slot="label" :class="b('label')">
        {{ label }}
      </span>
    </slot>

    <slot name="trailing">
      <Icon
        v-if="isTrailing && trailingIconName" :name="trailingIconName" data-slot="trailing-icon"
        :class="b('trailing-icon')"
      />
    </slot>
  </Primitive>
</template>

<style scoped lang="scss">
@use "./button.styles.scss" as *;
</style>
