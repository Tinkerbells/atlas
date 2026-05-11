<script lang="ts">
import type { VNode } from "vue";
</script>

<script setup lang="ts">
import { computed } from "vue";
import { Primitive } from "reka-ui";
import { useBem } from "@renderer/shared/ui/composables";

export interface DashboardResizeHandleProps {
  as?: any;
  class?: any;
  ui?: { base?: any };
}

export interface DashboardResizeHandleSlots {
  default?: (props?: Record<string, never>) => VNode[];
}

const props = defineProps<DashboardResizeHandleProps>();
defineSlots<DashboardResizeHandleSlots>();

const b = useBem("dashboard-resize-handle");
const baseClass = computed(() => b());
</script>

<template>
  <Primitive
    :as="as || 'div'"
    role="separator"
    data-slot="base"
    :class="[baseClass, props.class]"
  >
    <slot />
  </Primitive>
</template>

<style lang="scss">
@use "./dashboard-resize-handle.styles.scss" as *;
</style>
