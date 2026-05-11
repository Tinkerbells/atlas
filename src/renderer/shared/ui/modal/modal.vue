<script lang="ts">
import type { VNode } from "vue";
import type {
  DialogContentProps,
  DialogRootEmits,
  DialogRootProps,
  PointerDownOutsideEvent,
} from "reka-ui";
</script>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { computed, toRef } from "vue";
import { Button } from "@renderer/shared/ui/button";
import { createReusableTemplate, reactivePick } from "@vueuse/core";
import { pointerDownOutside } from "@renderer/shared/ui/utils/overlay";
import { FieldGroupReset, useBem, useComponentUI, usePortal } from "@renderer/shared/ui/composables";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  useForwardPropsEmits,
  VisuallyHidden,
} from "reka-ui";

export interface ModalProps extends DialogRootProps {
  title?: string;
  description?: string;
  content?: Omit<DialogContentProps, "as" | "asChild" | "forceMount"> & Record<string, any>;
  /**
   * Render an overlay behind the modal.
   * @defaultValue true
   */
  overlay?: boolean;
  /**
   * When `true`, enables scrollable overlay mode where content scrolls within the overlay.
   * @defaultValue false
   */
  scrollable?: boolean;
  /**
   * Animate the modal when opening or closing.
   * @defaultValue true
   */
  transition?: boolean;
  /**
   * When `true`, the modal will take up the full screen.
   * @defaultValue false
   */
  fullscreen?: boolean;
  /**
   * Render the modal in a portal.
   * @defaultValue true
   */
  portal?: boolean | string | HTMLElement;
  /**
   * Display a close button to dismiss the modal.
   * @defaultValue true
   */
  close?: boolean | Record<string, any>;
  /**
   * The icon displayed in the close button.
   * @defaultValue "lucide:x"
   */
  closeIcon?: string | any;
  /**
   * When `false`, the modal will not close when clicking outside or pressing escape.
   * @defaultValue true
   */
  dismissible?: boolean;
  class?: any;
  ui?: any;
}

/* eslint-disable vue/custom-event-name-casing */
export interface ModalEmits extends DialogRootEmits {
  "after:leave": [];
  "after:enter": [];
  "close:prevent": [];
}

export interface ModalSlots {
  default?: (props: { open: boolean }) => VNode[];
  content?: (props: { close: () => void }) => VNode[];
  header?: (props: { close: () => void }) => VNode[];
  title?: (props?: Record<string, never>) => VNode[];
  description?: (props?: Record<string, never>) => VNode[];
  actions?: (props?: Record<string, never>) => VNode[];
  close?: (props: { ui: any }) => VNode[];
  body?: (props: { close: () => void }) => VNode[];
  footer?: (props: { close: () => void }) => VNode[];
}

const props = withDefaults(defineProps<ModalProps>(), {
  close: true,
  portal: true,
  overlay: true,
  transition: true,
  modal: true,
  dismissible: true,
});

const emits = defineEmits<ModalEmits>();
const slots = defineSlots<ModalSlots>();

const { t } = useI18n();
const uiProp = useComponentUI("modal", props);

const rootProps = useForwardPropsEmits(reactivePick(props, "open", "defaultOpen", "modal"), emits);
const portalProps = usePortal(toRef(() => props.portal));
const contentProps = toRef(() => props.content);

const contentEvents = computed(() => {
  if (!props.dismissible) {
    const events = ["interactOutside", "escapeKeyDown"] as const;

    return events.reduce((acc, curr) => {
      acc[curr] = (e: Event) => {
        e.preventDefault();
        emits("close:prevent");
      };

      return acc;
    }, {} as Record<typeof events[number], (e: Event) => void>);
  }

  return {
    pointerDownOutside: (e: PointerDownOutsideEvent) => pointerDownOutside(e, { scrollable: props.scrollable }),
  };
});

const [DefineContentTemplate, ReuseContentTemplate] = createReusableTemplate();

const b = useBem("modal");
</script>

<!-- eslint-disable vue/no-template-shadow -->
<!-- eslint-disable vue/custom-event-name-casing -->
<template>
  <DialogRoot v-slot="{ open, close }" v-bind="rootProps">
    <DefineContentTemplate>
      <DialogContent
        data-slot="content" :class="[
          b('content', {
            transition: props.transition,
            fullscreen: props.fullscreen,
            scrollable: props.scrollable,
          }),
          !slots.default && props.class,
          uiProp?.content,
        ]" v-bind="contentProps" @after-enter="emits('after:enter')" @after-leave="emits('after:leave')"
        v-on="contentEvents"
      >
        <VisuallyHidden
          v-if="
            (!title && !slots.title)
              || (!description && !slots.description)
              || !!slots.content
          "
        >
          <DialogTitle v-if="!title && !slots.title" />
          <DialogTitle v-else-if="!!slots.content">
            <slot name="title">
              {{ title }}
            </slot>
          </DialogTitle>

          <DialogDescription v-if="!description && !slots.description" />
          <DialogDescription v-else-if="!!slots.content">
            <slot name="description">
              {{ description }}
            </slot>
          </DialogDescription>
        </VisuallyHidden>

        <slot name="content" :close="close">
          <div
            v-if="!!slots.header
              || (title || !!slots.title)
              || (description || !!slots.description)
              || (props.close || !!slots.close)" data-slot="header" :class="[b('header'), uiProp?.header]"
          >
            <slot name="header" :close="close">
              <div
                v-if="title || !!slots.title || description || !!slots.description" data-slot="wrapper"
                :class="[b('wrapper'), uiProp?.wrapper]"
              >
                <DialogTitle v-if="title || !!slots.title" data-slot="title" :class="[b('title'), uiProp?.title]">
                  <slot name="title">
                    {{ title }}
                  </slot>
                </DialogTitle>

                <DialogDescription
                  v-if="description || !!slots.description" data-slot="description"
                  :class="[b('description'), uiProp?.description]"
                >
                  <slot name="description">
                    {{ description }}
                  </slot>
                </DialogDescription>
              </div>

              <slot name="actions" />

              <DialogClose v-if="props.close || !!slots.close" as-child>
                <slot name="close" :ui="{}">
                  <Button
                    v-if="props.close" :icon="closeIcon || 'lucide:x'" color="neutral" variant="ghost"
                    :aria-label="t('modal.close')" v-bind="(typeof props.close === 'object' ? props.close : {})"
                    data-slot="close" :class="[b('close'), uiProp?.close]"
                  />
                </slot>
              </DialogClose>
            </slot>
          </div>

          <div v-if="!!slots.body" data-slot="body" :class="[b('body'), uiProp?.body]">
            <slot name="body" :close="close" />
          </div>

          <div v-if="!!slots.footer" data-slot="footer" :class="[b('footer'), uiProp?.footer]">
            <slot name="footer" :close="close" />
          </div>
        </slot>
      </DialogContent>
    </DefineContentTemplate>

    <DialogTrigger v-if="!!slots.default" as-child :class="props.class">
      <slot :open="open" />
    </DialogTrigger>

    <DialogPortal v-bind="portalProps">
      <FieldGroupReset>
        <template v-if="scrollable">
          <DialogOverlay
            data-slot="overlay" :class="[
              b('overlay', {
                'overlay': props.overlay,
                'transition': props.transition,
                'scrollable': props.scrollable,
                'scrollable-not-fullscreen': props.scrollable && !props.fullscreen,
              }),
              uiProp?.overlay,
            ]"
          >
            <ReuseContentTemplate />
          </DialogOverlay>
        </template>

        <template v-else>
          <DialogOverlay
            v-if="overlay" data-slot="overlay" :class="[
              b('overlay', {
                overlay: props.overlay,
                transition: props.transition,
                scrollable: props.scrollable,
              }),
              uiProp?.overlay,
            ]"
          />

          <ReuseContentTemplate />
        </template>
      </FieldGroupReset>
    </DialogPortal>
  </DialogRoot>
</template>
<!-- eslint-enable vue/custom-event-name-casing -->

<style lang="scss">
@use "./modal.styles.scss" as *;
</style>
