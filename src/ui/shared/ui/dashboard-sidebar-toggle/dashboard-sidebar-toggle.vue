<script setup lang="ts">
import type { VNode } from "vue";

import { useI18n } from "vue-i18n";
import { computed, ref } from "vue";

import { Button } from "@/ui/shared/ui/button";
import { useBem, useDashboard } from "@/ui/shared/ui/composables";

export interface DashboardSidebarToggleProps {
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

export interface DashboardSidebarToggleSlots {
  default?: (props?: Record<string, never>) => VNode[];
}

const props = withDefaults(defineProps<DashboardSidebarToggleProps>(), {
  color: "neutral",
  variant: "ghost",
  side: "left",
});

defineSlots<DashboardSidebarToggleSlots>();
const { t } = useI18n();

const b = useBem("dashboard-sidebar-toggle");

const { sidebarOpen, toggleSidebar } = useDashboard({ sidebarOpen: ref(false), toggleSidebar: () => {} });

const iconName = computed(() => props.icon || (sidebarOpen.value ? "lucide:x" : "lucide:menu"));
const ariaLabel = computed(() =>
  sidebarOpen.value ? t("dashboardSidebarToggle.close") : t("dashboardSidebarToggle.open"),
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
    @click="toggleSidebar"
  >
    <slot />
  </Button>
</template>

<style lang="scss">
@use "./dashboard-sidebar-toggle.styles.scss" as *;
</style>
