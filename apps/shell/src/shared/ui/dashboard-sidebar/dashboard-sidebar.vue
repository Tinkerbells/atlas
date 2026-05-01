<script lang="ts">
import type { VNode } from "vue";
</script>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Modal } from "~/shared/ui/modal";
import { createReusableTemplate } from "@vueuse/core";
import { computed, ref, toRef, useId, watch } from "vue";
import { DashboardResizeHandle } from "~/shared/ui/dashboard-resize-handle";
import { DashboardSidebarToggle } from "~/shared/ui/dashboard-sidebar-toggle";
import {
  useBem,
  useComponentUI,
  useDashboard,
  useResizable,
} from "~/shared/ui/composables";

export type DashboardSidebarMode = "modal" | "slideover" | "drawer";

export interface DashboardSidebarProps {
  id?: string;
  side?: "left" | "right";
  minSize?: number;
  maxSize?: number;
  defaultSize?: number;
  resizable?: boolean;
  collapsible?: boolean;
  collapsedSize?: number;
  mode?: DashboardSidebarMode;
  menu?: Record<string, any>;
  toggle?: boolean | Record<string, any>;
  toggleSide?: "left" | "right";
  autoClose?: boolean;
  class?: any;
  ui?: any;
}

export interface DashboardSidebarSlots {
  "header"?: (props: { collapsed: boolean; collapse: (value: boolean) => void }) => VNode[];
  "default"?: (props: { collapsed: boolean; collapse: (value: boolean) => void }) => VNode[];
  "footer"?: (props: { collapsed: boolean; collapse: (value: boolean) => void }) => VNode[];
  "toggle"?: (props: { open: boolean; toggle: () => void; ui: any }) => VNode[];
  "content"?: (props: { close?: () => void }) => VNode[];
  "resize-handle"?: (props: {
    onMouseDown: (e: MouseEvent) => void;
    onTouchStart: (e: TouchEvent) => void;
    onDoubleClick: (e: MouseEvent) => void;
    ui: any;
  }) => VNode[];
}

const props = withDefaults(defineProps<DashboardSidebarProps>(), {
  side: "left",
  mode: "slideover",
  autoClose: true,
  toggle: true,
  toggleSide: "left",
  minSize: 10,
  maxSize: 20,
  defaultSize: 15,
  resizable: false,
  collapsible: false,
  collapsedSize: 0,
});

const slots = defineSlots<DashboardSidebarSlots>();

const open = defineModel<boolean>("open", { default: false });
const collapsed = defineModel<boolean>("collapsed", { default: false });

const { t } = useI18n();
const b = useBem("dashboard-sidebar");
const uiProp = useComponentUI("dashboard-sidebar", props);

const dashboardContext = useDashboard({
  storageKey: "dashboard",
  unit: "%",
  sidebarOpen: ref(false),
  sidebarCollapsed: ref(false),
});

const id = computed(() => `${dashboardContext.storageKey}-sidebar-${props.id || useId()}`);

const { el, size, collapse, isCollapsed, isDragging, onMouseDown, onTouchStart, onDoubleClick } = useResizable(
  id.value,
  toRef(() => ({ ...dashboardContext, ...props })),
  { collapsed },
);

const [DefineToggleTemplate, ReuseToggleTemplate] = createReusableTemplate();
const [DefineResizeHandleTemplate, ReuseResizeHandleTemplate] = createReusableTemplate();

function toggleOpen() {
  open.value = !open.value;
}

watch(open, () => {
  dashboardContext.sidebarOpen.value = open.value;
}, { immediate: true });

watch(isCollapsed, () => {
  dashboardContext.sidebarCollapsed.value = isCollapsed.value;
}, { immediate: true });
</script>

<template>
  <DefineToggleTemplate>
    <slot name="toggle" :open="open" :toggle="toggleOpen" :ui="uiProp">
      <DashboardSidebarToggle
        v-if="toggle"
        v-bind="(typeof toggle === 'object' ? toggle : {})"
        :side="toggleSide"
        data-slot="toggle"
        :class="[b('toggle', { toggleSide }), uiProp?.toggle]"
      />
    </slot>
  </DefineToggleTemplate>

  <DefineResizeHandleTemplate>
    <slot
      name="resize-handle"
      :on-mouse-down="onMouseDown"
      :on-touch-start="onTouchStart"
      :on-double-click="onDoubleClick"
      :ui="uiProp"
    >
      <DashboardResizeHandle
        v-if="resizable"
        :aria-controls="id"
        data-slot="handle"
        :class="[b('handle'), uiProp?.handle]"
        @mousedown="onMouseDown"
        @touchstart="onTouchStart"
        @dblclick="onDoubleClick"
      />
    </slot>
  </DefineResizeHandleTemplate>

  <ReuseResizeHandleTemplate v-if="side === 'right'" />

  <div
    :id="id"
    ref="el"
    v-bind="$attrs"
    :data-collapsed="isCollapsed"
    :data-dragging="isDragging"
    data-slot="root"
    :class="[b({ side: props.side }), props.class, uiProp?.root]"
    :style="{ '--width': `${size || 0}${dashboardContext.unit}` }"
  >
    <div v-if="!!slots.header" data-slot="header" :class="[b('header'), uiProp?.header]">
      <slot name="header" :collapsed="isCollapsed" :collapse="collapse" />
    </div>

    <div data-slot="body" :class="[b('body'), uiProp?.body]">
      <slot :collapsed="isCollapsed" :collapse="collapse" />
    </div>

    <div v-if="!!slots.footer" data-slot="footer" :class="[b('footer'), uiProp?.footer]">
      <slot name="footer" :collapsed="isCollapsed" :collapse="collapse" />
    </div>
  </div>

  <ReuseResizeHandleTemplate v-if="side === 'left'" />

  <Modal
    v-model:open="open"
    :title="t('dashboardSidebar.title')"
    :description="t('dashboardSidebar.description')"
    :fullscreen="mode === 'modal'"
    :transition="mode !== 'modal'"
    :class="uiProp?.content"
  >
    <template #content="{ close }">
      <slot name="content" :close="close">
        <div v-if="!!slots.header || mode !== 'drawer'" data-slot="header" :class="[b('header', { menu: true }), uiProp?.header]">
          <ReuseToggleTemplate v-if="mode !== 'drawer' && toggleSide === 'left'" />

          <slot name="header" :collapsed="false" :collapse="() => {}" />

          <ReuseToggleTemplate v-if="mode !== 'drawer' && toggleSide === 'right'" />
        </div>

        <div data-slot="body" :class="[b('body', { menu: true }), uiProp?.body]">
          <slot :collapsed="false" :collapse="() => {}" />
        </div>

        <div v-if="!!slots.footer" data-slot="footer" :class="[b('footer', { menu: true }), uiProp?.footer]">
          <slot name="footer" :collapsed="false" :collapse="() => {}" />
        </div>
      </slot>
    </template>
  </Modal>
</template>

<style lang="scss">
@use "./dashboard-sidebar.styles.scss" as *;
</style>
