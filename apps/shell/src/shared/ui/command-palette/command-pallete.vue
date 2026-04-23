<!-- eslint-disable vue/no-v-html -->
<script lang="ts">
import type { FuseResult } from "fuse.js";
import type { UseFuseOptions } from "@vueuse/integrations/useFuse";
</script>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { useFuse } from "@vueuse/integrations/useFuse";
import { createReusableTemplate, refThrottled } from "@vueuse/core";
import {
  ListboxContent,
  ListboxFilter,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxItemIndicator,
  ListboxRoot,
  ListboxVirtualizer,
} from "reka-ui";

import UiIcon from "./ui-icon.vue";
import { highlight } from "./highlight";

export interface CommandPaletteItem {
  prefix?: string;
  label?: string;
  suffix?: string;
  description?: string;
  icon?: string;
  kbds?: string[];
  active?: boolean;
  loading?: boolean;
  disabled?: boolean;
  slot?: string;
  placeholder?: string;
  children?: CommandPaletteItem[];
  onSelect?: (e: Event) => void;
  class?: any;
  [key: string]: any;
}

export interface CommandPaletteGroup<T extends CommandPaletteItem = CommandPaletteItem> {
  id: string;
  label?: string;
  slot?: string;
  items?: T[];
  ignoreFilter?: boolean;
  postFilter?: (searchTerm: string, items: T[]) => T[];
  highlightedIcon?: string;
}

export interface CommandPaletteProps {
  groups?: CommandPaletteGroup[];
  placeholder?: string;
  icon?: string;
  selectedIcon?: string;
  childrenIcon?: string;
  closeIcon?: string;
  backIcon?: string;
  trailingIcon?: string;
  loadingIcon?: string;
  autofocus?: boolean;
  close?: boolean;
  back?: boolean;
  loading?: boolean;
  fuse?: UseFuseOptions<CommandPaletteItem>;
  labelKey?: string;
  descriptionKey?: string;
  preserveGroupOrder?: boolean;
  disabled?: boolean;
  virtualize?: boolean | {
    overscan?: number;
    estimateSize?: number | ((index: number) => number);
  };
}

type T = CommandPaletteItem;
type G = CommandPaletteGroup<T>;

const props = withDefaults(defineProps<CommandPaletteProps>(), {
  labelKey: "label",
  descriptionKey: "description",
  autofocus: true,
  back: true,
  preserveGroupOrder: false,
  icon: "lucide:search",
  selectedIcon: "lucide:check",
  childrenIcon: "lucide:chevron-right",
  closeIcon: "lucide:x",
  backIcon: "lucide:arrow-left",
  virtualize: false,
  loadingIcon: "lucide:loader-circle",
  loading: false,
});

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const slots = defineSlots<{
  "empty"?: (props: { searchTerm: string }) => any;
  "footer"?: () => any;
  "item": (props: { item: T; index: number }) => any;
  "item-leading": (props: { item: T; index: number }) => any;
  "item-label": (props: { item: T; index: number }) => any;
  "item-trailing": (props: { item: T; index: number }) => any;
}>();

const searchTerm = defineModel<string>("searchTerm", { default: "" });

const [DefineItemTemplate, ReuseItemTemplate] = createReusableTemplate<{
  item: T & { labelHtml?: string; suffixHtml?: string };
  index: number;
}>();

const history = ref<(G & { placeholder?: string })[]>([]);

const placeholder = computed(() =>
  history.value[history.value.length - 1]?.placeholder
  || props.placeholder
  || "Type a command or search...",
);

const currentGroups = computed<G[]>(
  () => history.value?.length
    ? [history.value[history.value.length - 1] as G]
    : (props.groups as G[]) || [],
);

const fuseOptions = computed<UseFuseOptions<T>>(() => ({
  fuseOptions: {
    ignoreLocation: true,
    threshold: 0.1,
    keys: [props.labelKey, "suffix"] as any,
  },
  resultLimit: 12,
  matchAllWhenSearchEmpty: true,
  ...props.fuse,
}));

const searchableItems = computed(() =>
  currentGroups.value
    .filter((group) => {
      if (!group.id)
        return false;
      if (group.ignoreFilter)
        return false;
      return true;
    })
    .flatMap(group => group.items?.map(item => ({ ...item, group: group.id })) || []),
);

const { results: fuseResults } = useFuse<T>(
  searchTerm,
  searchableItems,
  fuseOptions,
);

const throttledFuseResults = refThrottled(fuseResults, 16, true);

function processGroupItems(
  group: G,
  items: (T & { matches?: FuseResult<T>["matches"] })[],
) {
  let processed = items;

  if (group.postFilter) {
    processed = group.postFilter(searchTerm.value, processed);
  }

  return {
    ...group,
    items: processed.slice(0, (fuseOptions.value.resultLimit as number) || 12).map(item => ({
      ...item,
      labelHtml: highlight(item, searchTerm.value, props.labelKey),
      suffixHtml: highlight(item, searchTerm.value, undefined, [props.labelKey]),
    })),
  };
}

const filteredGroups = computed(() => {
  const groups = currentGroups.value;

  const groupsById = throttledFuseResults.value.reduce(
    (acc, result) => {
      const { item, matches } = result;
      if (!item.group)
        return acc;
      acc[item.group] ||= [];
      acc[item.group]!.push({ ...item, matches });
      return acc;
    },
    {} as Record<string, (T & { matches?: FuseResult<T>["matches"] })[]>,
  );

  if (props.preserveGroupOrder) {
    const result: ReturnType<typeof processGroupItems>[] = [];
    for (const group of groups) {
      if (!group.items?.length)
        continue;
      const items = group.ignoreFilter ? group.items : groupsById[group.id];
      if (!items?.length)
        continue;
      const processed = processGroupItems(group, items);
      if (processed.items?.length)
        result.push(processed);
    }
    return result;
  }

  const fuseGroups = Object.entries(groupsById)
    .map(([id, items]) => {
      const group = groups.find(g => g.id === id);
      if (!group)
        return undefined;
      const processed = processGroupItems(group, items);
      return processed.items?.length ? processed : undefined;
    })
    .filter((g): g is NonNullable<typeof g> => g !== undefined);

  const nonFuseGroups = groups
    .map((group, index) => ({ ...group, index }))
    .filter(group => group.ignoreFilter && group.items?.length)
    .map((group) => {
      const processed = processGroupItems(group, group.items || []);
      return { ...processed, index: group.index };
    })
    .filter(group => group.items?.length);

  return nonFuseGroups.reduce((acc, group) => {
    acc.splice(group.index, 0, group);
    return acc;
  }, [...fuseGroups]);
});

const filteredItems = computed(() =>
  filteredGroups.value.flatMap(group => group.items || []),
);

const virtualizerProps = computed(() => {
  if (!props.virtualize)
    return false;

  const defaults = { overscan: 12, estimateSize: 32 };

  if (typeof props.virtualize === "boolean")
    return defaults;

  return { ...defaults, ...props.virtualize };
});

const rootRef = useTemplateRef("rootRef");

function navigate(item: T) {
  if (!item.children?.length)
    return;

  history.value.push({
    id: `history-${history.value.length}`,
    label: item.label,
    slot: item.slot,
    placeholder: item.placeholder,
    items: item.children,
  } as G & { placeholder?: string });

  searchTerm.value = "";
  rootRef.value?.highlightFirstItem();
}

function navigateBack() {
  if (!history.value.length)
    return;
  history.value.pop();
  searchTerm.value = "";
  rootRef.value?.highlightFirstItem();
}

function onBackspace() {
  if (!searchTerm.value)
    navigateBack();
}

function onSelect(e: Event, item: T) {
  if (item.children?.length) {
    e.preventDefault();
    navigate(item);
  }
  else {
    item.onSelect?.(e);
  }
}

function get(obj: any, key: string): any {
  return obj?.[key];
}
</script>

<template>
  <DefineItemTemplate v-slot="{ item, index }">
    <ListboxItem
      :value="item"
      :disabled="item.disabled"
      data-slot="item"
      class="cp__item"
      @select="onSelect($event, item)"
    >
      <slot name="item-leading" :item="item" :index="index">
        <span v-if="item.loading" data-slot="itemLeadingIcon" class="cp__item-icon cp__item-icon--loading">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5A6.5 6.5 0 1 1 1.5 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
        </span>
        <UiIcon v-else-if="item.icon" :name="item.icon" data-slot="itemLeadingIcon" class="cp__item-icon" />
      </slot>

      <span data-slot="itemWrapper" class="cp__item-body">
        <slot name="item-label" :item="item" :index="index">
          <span data-slot="itemLabel" class="cp__item-label">
            <span v-if="item.prefix" data-slot="itemLabelPrefix" class="cp__item-prefix">{{ item.prefix }}</span>

            <span v-if="item.labelHtml" data-slot="itemLabelBase" class="cp__item-text" v-html="item.labelHtml" />
            <span v-else data-slot="itemLabelBase" class="cp__item-text">{{ get(item, labelKey) }}</span>

            <span v-if="item.suffixHtml" data-slot="itemLabelSuffix" class="cp__item-suffix" v-html="item.suffixHtml" />
            <span v-else-if="item.suffix" data-slot="itemLabelSuffix" class="cp__item-suffix">{{ item.suffix }}</span>
          </span>
        </slot>

        <span v-if="get(item, descriptionKey)" data-slot="itemDescription" class="cp__item-desc">
          {{ get(item, descriptionKey) }}
        </span>
      </span>

      <span data-slot="itemTrailing" class="cp__item-trailing">
        <slot name="item-trailing" :item="item" :index="index">
          <span
            v-if="item.children && item.children.length > 0"
            data-slot="itemTrailingIcon"
            class="cp__item-arrow"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </span>

          <span v-else-if="item.kbds?.length" data-slot="itemTrailingKbds" class="cp__item-kbds">
            <kbd v-for="(kbd, kbdIndex) in item.kbds" :key="kbdIndex">{{ kbd }}</kbd>
          </span>
        </slot>

        <ListboxItemIndicator v-if="!item.children?.length" as-child>
          <span data-slot="itemSelectedIcon" class="cp__item-selected">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </span>
        </ListboxItemIndicator>
      </span>
    </ListboxItem>
  </DefineItemTemplate>

  <ListboxRoot
    ref="rootRef"
    :disabled="disabled"
    highlight-on-hover
    selection-behavior="replace"
    data-slot="root"
    class="cp"
  >
    <div data-slot="input-wrapper" class="cp__input-wrapper">
      <ListboxFilter v-model="searchTerm" as-child>
        <div class="cp__input-row">
          <button
            v-if="history?.length && back"
            class="cp__back-btn"
            aria-label="Back"
            data-slot="back"
            @click="navigateBack"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>

          <span v-if="loading" class="cp__search-icon cp__search-icon--loading" data-slot="searchIcon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5A6.5 6.5 0 1 1 1.5 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
          </span>
          <span v-else class="cp__search-icon" data-slot="searchIcon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5" /><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
          </span>

          <input
            class="cp__input"
            :placeholder="placeholder"
            :autofocus="autofocus"
            data-slot="input"
            @keydown.backspace="onBackspace"
          >

          <button
            v-if="close"
            class="cp__close-btn"
            aria-label="Close"
            data-slot="close"
            @click="emit('update:open', false)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
          </button>
        </div>
      </ListboxFilter>
    </div>

    <ListboxContent data-slot="content" class="cp__content">
      <div v-if="filteredGroups?.length" data-slot="viewport" class="cp__viewport">
        <ListboxVirtualizer
          v-if="!!virtualize"
          v-slot="{ option: item, virtualItem }"
          :options="filteredItems"
          :text-content="(item: any) => get(item, labelKey)"
          v-bind="virtualizerProps"
        >
          <ReuseItemTemplate :item="item" :index="virtualItem.index" />
        </ListboxVirtualizer>

        <template v-else>
          <ListboxGroup
            v-for="group in filteredGroups"
            :key="`group-${group.id}`"
            data-slot="group"
            class="cp__group"
          >
            <ListboxGroupLabel
              v-if="group.label"
              data-slot="label"
              class="cp__group-label"
            >
              {{ group.label }}
            </ListboxGroupLabel>

            <ReuseItemTemplate
              v-for="(item, index) in group.items"
              :key="`group-${group.id}-${index}`"
              :item="item"
              :index="index"
            />
          </ListboxGroup>
        </template>
      </div>

      <div v-else data-slot="empty" class="cp__empty">
        <slot name="empty" :search-term="searchTerm">
          <template v-if="searchTerm">
            No results for "{{ searchTerm }}"
          </template>
          <template v-else>
            No results found.
          </template>
        </slot>
      </div>
    </ListboxContent>

    <div v-if="!!slots.footer" data-slot="footer" class="cp__footer">
      <slot name="footer" />
    </div>
  </ListboxRoot>
</template>

<style scoped>
@keyframes cp-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cp {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid var(--cp-border, var(--border, #e5e4e7));
  background: var(--cp-bg, var(--color-body, #fff));
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  overflow: hidden;
  max-width: 640px;
  width: 100%;
  font-size: 14px;
  color: var(--cp-text, var(--color-text, #6b6375));
}

.cp__input-wrapper {
  border-bottom: 1px solid var(--cp-border, var(--border, #e5e4e7));
}

.cp__input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
}

.cp__back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  padding: 4px;
  border-radius: 4px;
  flex-shrink: 0;
  opacity: 0.6;
}

.cp__back-btn:hover {
  background: var(--cp-hover, rgb(0 0 0 / 0.06));
  opacity: 1;
}

.cp__search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.4;
}

.cp__search-icon--loading {
  opacity: 0.6;
  animation: cp-spin 1s linear infinite;
}

.cp__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  color: inherit;
  min-width: 0;
}

.cp__input::placeholder {
  color: inherit;
  opacity: 0.4;
}

.cp__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  padding: 4px;
  border-radius: 4px;
  flex-shrink: 0;
  opacity: 0.6;
}

.cp__close-btn:hover {
  background: var(--cp-hover, rgb(0 0 0 / 0.06));
  opacity: 1;
}

.cp__content {
  overflow-y: auto;
  max-height: 400px;
}

.cp__viewport {
  padding: 4px 0;
}

.cp__group + .cp__group {
  border-top: 1px solid var(--cp-border, var(--border, #e5e4e7));
  margin-top: 4px;
}

.cp__group-label {
  display: block;
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  color: inherit;
  opacity: 0.45;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  user-select: none;
}

.cp__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.1s;
  color: inherit;
  outline: none;
}

.cp__item[data-highlighted] {
  background: var(--cp-hover, rgb(0 0 0 / 0.06));
}

.cp__item[data-state="checked"] .cp__item-selected {
  opacity: 1;
}

.cp__item-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
}

.cp__item-icon--loading {
  animation: cp-spin 1s linear infinite;
}

.cp__item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cp__item-label {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.cp__item-prefix {
  opacity: 0.45;
  font-size: 12px;
  flex-shrink: 0;
}

.cp__item-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cp__item-text :deep(mark) {
  background: none;
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.cp__item-suffix {
  opacity: 0.45;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cp__item-desc {
  font-size: 12px;
  opacity: 0.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cp__item-trailing {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cp__item-arrow {
  opacity: 0.35;
  display: flex;
  align-items: center;
}

.cp__item-kbds {
  display: flex;
  gap: 3px;
}

.cp__item-kbds kbd {
  font-family: inherit;
  font-size: 11px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 4px;
  border: 1px solid var(--cp-border, var(--border, #e5e4e7));
  background: var(--cp-kbd-bg, rgb(0 0 0 / 0.04));
}

.cp__item-selected {
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.1s;
}

.cp__empty {
  padding: 24px 12px;
  text-align: center;
  opacity: 0.45;
  font-size: 13px;
}

.cp__footer {
  border-top: 1px solid var(--cp-border, var(--border, #e5e4e7));
  padding: 8px 12px;
}
</style>
