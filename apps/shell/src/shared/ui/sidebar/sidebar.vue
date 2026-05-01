<script lang="ts">
import type { VNode } from "vue";
</script>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Primitive } from "reka-ui";
import { Modal } from "~/shared/ui/modal";
import { Button } from "~/shared/ui/button";
import { useBem } from "~/shared/ui/composables";
import { computed, onMounted, ref, watch } from "vue";
import { createReusableTemplate, useMediaQuery } from "@vueuse/core";

export type SidebarState = "expanded" | "collapsed";
export type SidebarMode = "modal" | "slideover" | "drawer";
export type SidebarCollapsible = "offcanvas" | "icon" | "none";
export type SidebarVariant = "sidebar" | "floating" | "inset";
export type SidebarSide = "left" | "right";

export interface SidebarProps {
  as?: any;
  variant?: SidebarVariant;
  collapsible?: SidebarCollapsible;
  side?: SidebarSide;
  title?: string;
  description?: string;
  close?: boolean | Record<string, any>;
  closeIcon?: string;
  rail?: boolean;
  mode?: SidebarMode;
  menu?: Record<string, any>;
  class?: any;
  ui?: any;
}

export interface SidebarSlots {
  header?: (props: { state: SidebarState; open: boolean; close: () => void }) => VNode[];
  title?: (props: { state: SidebarState }) => VNode[];
  description?: (props: { state: SidebarState }) => VNode[];
  actions?: (props: { state: SidebarState }) => VNode[];
  close?: (props: { ui: any; state: SidebarState }) => VNode[];
  default?: (props: { state: SidebarState; open: boolean; close: () => void }) => VNode[];
  footer?: (props: { state: SidebarState; open: boolean; close: () => void }) => VNode[];
  rail?: (props: { ui: any; state: SidebarState }) => VNode[];
  content?: (props: { close: () => void }) => VNode[];
}

const props = withDefaults(defineProps<SidebarProps>(), {
  as: "aside",
  variant: "sidebar",
  collapsible: "offcanvas",
  side: "left",
  close: false,
  rail: false,
  mode: "slideover",
});

const slots = defineSlots<SidebarSlots>();

const [DefineInnerTemplate, ReuseInnerTemplate] = createReusableTemplate();
const [DefineContentTemplate, ReuseContentTemplate] = createReusableTemplate();

const mediaQuery = useMediaQuery("(max-width: 1023px)");
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});

const isMobile = computed(() => isMounted.value && mediaQuery.value);

const modelOpen = defineModel<boolean>("open", { default: true });
const openMobile = ref(false);
const desktopOpen = ref(modelOpen.value);

const open = computed({
  get: () => (isMobile.value ? openMobile.value : modelOpen.value),
  set: (value: boolean) => {
    if (isMobile.value) {
      openMobile.value = value;
    }
    else {
      modelOpen.value = value;
    }
  },
});

watch(isMobile, (mobile) => {
  if (mobile) {
    desktopOpen.value = modelOpen.value;
    modelOpen.value = false;
  }
  else {
    modelOpen.value = desktopOpen.value;
  }
}, { immediate: true });

watch(modelOpen, (value) => {
  if (isMobile.value) {
    openMobile.value = value;
  }
});

watch(openMobile, (value) => {
  if (isMobile.value) {
    modelOpen.value = value;
  }
});

const { t } = useI18n();
const b = useBem("sidebar");

const state = computed<SidebarState>(() => (open.value ? "expanded" : "collapsed"));

const canClose = computed(() => (props.close && props.collapsible !== "none") || isMobile.value);

function closeSidebar() {
  open.value = false;
}

const hasHeader = computed(() =>
  !!slots.header
  || props.title
  || !!slots.title
  || props.description
  || !!slots.description
  || !!slots.actions
  || canClose.value
  || !!slots.close,
);
</script>

<template>
  <DefineContentTemplate>
    <div v-if="hasHeader" data-slot="header" :class="b('header')">
      <slot name="header" :state="state" :open="open" :close="closeSidebar">
        <div v-if="title || !!slots.title || description || !!slots.description" data-slot="wrapper" :class="b('wrapper')">
          <p v-if="title || !!slots.title" data-slot="title" :class="b('title')">
            <slot name="title" :state="state">
              {{ title }}
            </slot>
          </p>

          <p v-if="description || !!slots.description" data-slot="description" :class="b('description')">
            <slot name="description" :state="state">
              {{ description }}
            </slot>
          </p>
        </div>

        <div v-if="!!slots.actions || canClose" data-slot="actions" :class="b('actions')">
          <slot name="actions" :state="state" />

          <slot name="close" :state="state" :ui="{}">
            <Button
              v-if="canClose"
              :icon="closeIcon || 'lucide:x'"
              color="neutral"
              variant="ghost"
              :aria-label="t('sidebar.close')"
              v-bind="(typeof props.close === 'object' ? props.close : {})"
              data-slot="close"
              :class="b('close')"
              @click="closeSidebar"
            />
          </slot>
        </div>
      </slot>
    </div>

    <div data-slot="body" :class="b('body')">
      <slot :state="state" :open="open" :close="closeSidebar" />
    </div>

    <div v-if="!!slots.footer" data-slot="footer" :class="b('footer')">
      <slot name="footer" :state="state" :open="open" :close="closeSidebar" />
    </div>
  </DefineContentTemplate>

  <DefineInnerTemplate>
    <div data-slot="inner" :class="b('inner')">
      <ReuseContentTemplate />
    </div>
  </DefineInnerTemplate>

  <!-- Non-collapsible: simple inline sidebar -->
  <Primitive
    v-if="collapsible === 'none'"
    :as="as"
    v-bind="$attrs"
    data-slot="root"
    :data-variant="variant"
    :class="[b({ variant, collapsible: 'none', side }), props.class]"
  >
    <ReuseInnerTemplate />
  </Primitive>

  <!-- Collapsible: fixed sidebar with gap spacer + mobile menu -->
  <template v-else>
    <Primitive
      :as="as"
      v-bind="$attrs"
      data-slot="root"
      :data-state="state"
      :data-collapsible="state === 'collapsed' ? collapsible : undefined"
      :data-variant="variant"
      :data-side="side"
      :class="[b({ variant, collapsible, side }), props.class]"
    >
      <!-- Gap spacer: reserves layout space for the fixed sidebar -->
      <div
        data-slot="gap"
        :data-state="state"
        :class="b('gap', { state, variant, collapsible })"
      />

      <!-- Fixed container: the actual visible sidebar -->
      <div
        data-slot="container"
        :data-state="state"
        :class="b('container', { state, variant, collapsible, side })"
      >
        <ReuseInnerTemplate />

        <slot v-if="rail" name="rail" :state="state" :ui="{}">
          <button
            data-slot="rail"
            :data-state="state"
            :aria-label="t('sidebar.toggle')"
            :tabindex="-1"
            :class="b('rail', { state, side, variant })"
            @click="open = !open"
          />
        </slot>
      </div>
    </Primitive>

    <!-- Mobile menu -->
    <Modal
      v-if="isMobile"
      v-model:open="openMobile"
      :title="title"
      :description="description"
      v-bind="menu"
      :class="props.class"
    >
      <template #content="{ close: closeModal }">
        <slot name="content" :close="closeModal">
          <ReuseContentTemplate />
        </slot>
      </template>
    </Modal>
  </template>
</template>

<style lang="scss">
@use "./sidebar.styles.scss" as *;
</style>
