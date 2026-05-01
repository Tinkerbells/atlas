<script setup lang="ts">
import type { VNode } from "vue";

import { useI18n } from "vue-i18n";
import { computed, ref } from "vue";
import { Button } from "~/shared/ui/button";
import { useBem, useDashboard } from "~/shared/ui/composables";

export interface DashboardSidebarCollapseProps {
  color?: "primary" | "neutral" | "error";
  variant?: "solid" | "outline" | "soft" | "subtle" | "ghost" | "link";
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
  side?: "left" | "right";
}

export interface DashboardSidebarCollapseSlots {
  default?: (props?: Record<string, never>) => VNode[];
}

const props = withDefaults(defineProps<DashboardSidebarCollapseProps>(), {
  color: "neutral",
  variant: "ghost",
  side: "left",
});

defineSlots<DashboardSidebarCollapseSlots>();
const { t } = useI18n();

const b = useBem("dashboard-sidebar-collapse");

const { sidebarCollapsed, collapseSidebar } = useDashboard({ sidebarCollapsed: ref(false), collapseSidebar: () => {} });

const iconName = computed(() => props.icon || (sidebarCollapsed.value ? "lucide:panel-left-open" : "lucide:panel-left-close"));
const ariaLabel = computed(() =>
  sidebarCollapsed.value ? t("dashboardSidebarCollapse.expand") : t("dashboardSidebarCollapse.collapse"),
);
</script>

<template>
  <Button
    :color="color"
    :variant="variant"
    :size="size"
    :square="square"
    :block="block"
    :loading="loading"
    :loading-auto="loadingAuto"
    :loading-icon="loadingIcon"
    :icon="iconName"
    :leading="leading"
    :leading-icon="leadingIcon"
    :trailing="trailing"
    :trailing-icon="trailingIcon"
    :disabled="disabled"
    :type="type"
    :aria-label="ariaLabel"
    data-slot="base"
    :class="[b({ side: props.side }), props.class]"
    @click="collapseSidebar?.(!sidebarCollapsed)"
  >
    <slot />
  </Button>
</template>

<style lang="scss">
@use "./dashboard-sidebar-collapse.styles.scss" as *;
</style>
