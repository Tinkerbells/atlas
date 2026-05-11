<script lang="ts">
import type { IconifyRenderMode } from "@iconify/vue";
</script>

<script setup lang="ts">
import { computed } from "vue";
import { Icon as IconifyIcon } from "@iconify/vue";
import { useBem } from "@renderer/shared/ui/composables/use-bem";

export type IconCustomizeFn = (content: string, name: string, prefix: string, provider: string) => string;

export interface IconProps {
  name: string | any;
  mode?: "svg" | "css";
  size?: string | number;
  customize?: IconCustomizeFn | boolean | null;
  class?: any;
}

const props = defineProps<IconProps>();

const b = useBem("icon");

function resolveCustomizeFn(
  customize: IconProps["customize"],
): IconCustomizeFn | undefined {
  if (customize === false)
    return undefined;
  if (customize === true || customize === null)
    return undefined;
  return customize;
}

const mode = computed(() => {
  if (props.mode === "css")
    return "style" as IconifyRenderMode;
  return props.mode as IconifyRenderMode;
});

const size = computed(() => props.size);
const customize = computed(() => resolveCustomizeFn(props.customize));
</script>

<template>
  <IconifyIcon
    v-if="typeof name === 'string'" data-slot="root" :icon="name.replace(/^i-/, '')" :mode="mode"
    :width="size" :height="size" :customise="customize" :class="[b(), props.class]"
  />
  <component :is="name" v-else data-slot="root" :class="[b(), props.class]" />
</template>

<style scoped lang="scss">
@use "./icon.styles.scss" as *;
</style>
