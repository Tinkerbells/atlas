<script lang="ts">
import type { VNode } from "vue";
import type { ConfigProviderProps, TooltipProviderProps } from "reka-ui";
</script>

<script setup lang="ts">
import { provide, toRef, useId } from "vue";
import { reactivePick } from "@vueuse/core";
import { ConfigProvider, TooltipProvider, useForwardProps } from "reka-ui";
import { portalTargetInjectionKey } from "~/shared/ui/composables/use-portal";

export interface AppProps extends Omit<ConfigProviderProps, "useId"> {
  tooltip?: TooltipProviderProps;
  portal?: boolean | string | HTMLElement;
}

export interface AppSlots {
  default?: (props?: Record<string, never>) => VNode[];
}

defineOptions({ name: "App" });

const props = withDefaults(defineProps<AppProps>(), {
  portal: "body",
});

defineSlots<AppSlots>();

const configProviderProps = useForwardProps(reactivePick(props, "scrollBody"));
const tooltipProps = toRef(() => props.tooltip);

const portal = toRef(() => props.portal);
provide(portalTargetInjectionKey, portal);
</script>

<template>
  <ConfigProvider :use-id="() => (useId() as string)" :dir="props.dir" v-bind="configProviderProps">
    <TooltipProvider v-bind="tooltipProps">
      <slot />
    </TooltipProvider>
  </ConfigProvider>
</template>
