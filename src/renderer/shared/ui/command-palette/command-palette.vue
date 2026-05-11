<!-- eslint-disable vue/no-v-html -->
<script lang="ts">
import type { FuseResult } from "fuse.js";
import type { UseFuseOptions } from "@vueuse/integrations/useFuse";
</script>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Icon } from "@renderer/shared/ui/icon";
import { computed, ref, useTemplateRef } from "vue";
import { useFuse } from "@vueuse/integrations/useFuse";
import { useBem } from "@renderer/shared/ui/composables";
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
  "select": [item: T];
}>();

const slots = defineSlots<{
  "empty"?: (props: { searchTerm: string }) => any;
  "footer"?: () => any;
  "item": (props: { item: T; index: number }) => any;
  "item-leading": (props: { item: T; index: number }) => any;
  "item-label": (props: { item: T; index: number }) => any;
  "item-trailing": (props: { item: T; index: number }) => any;
}>();

const { t } = useI18n();
const b = useBem("command-palette");

const searchTerm = defineModel<string>("searchTerm", { default: "" });

const [DefineItemTemplate, ReuseItemTemplate] = createReusableTemplate<{
  item: T & { labelHtml?: string; suffixHtml?: string };
  index: number;
}>();

const history = ref<(G & { placeholder?: string })[]>([]);

const placeholder = computed(() =>
  history.value[history.value.length - 1]?.placeholder
  || props.placeholder
  || t("commandPalette.placeholder"),
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

function resolveIconName(name?: string): string {
  if (!name)
    return "";
  if (name.includes(":"))
    return name;
  return `lucide:${name}`;
}

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
    emit("select", item);
  }
}

function get(obj: any, key: string): any {
  return obj?.[key];
}
</script>

<template>
  <DefineItemTemplate v-slot="{ item, index }">
    <ListboxItem
      :value="item" :disabled="item.disabled" data-slot="item" :class="b('item')"
      @select="onSelect($event, item)"
    >
      <slot name="item-leading" :item="item" :index="index">
        <span
          v-if="item.loading" data-slot="itemLeadingIcon"
          :class="b('item-icon', { loading: item.loading })"
        >
          <Icon :name="loadingIcon" :size="16" />
        </span>
        <span v-else-if="item.icon" data-slot="itemLeadingIcon" :class="b('item-icon')">
          <Icon :name="resolveIconName(item.icon)" :size="16" />
        </span>
      </slot>

      <span data-slot="itemWrapper" :class="b('item-body')">
        <slot name="item-label" :item="item" :index="index">
          <span data-slot="itemLabel" :class="b('item-label')">
            <span v-if="item.prefix" data-slot="itemLabelPrefix" :class="b('item-prefix')">{{ item.prefix }}</span>

            <span v-if="item.labelHtml" data-slot="itemLabelBase" :class="b('item-text')" v-html="item.labelHtml" />
            <span v-else data-slot="itemLabelBase" :class="b('item-text')">{{ get(item, labelKey) }}</span>

            <span
              v-if="item.suffixHtml" data-slot="itemLabelSuffix" :class="b('item-suffix')"
              v-html="item.suffixHtml"
            />
            <span v-else-if="item.suffix" data-slot="itemLabelSuffix" :class="b('item-suffix')">{{ item.suffix }}</span>
          </span>
        </slot>

        <span v-if="get(item, descriptionKey)" data-slot="itemDescription" :class="b('item-desc')">
          {{ get(item, descriptionKey) }}
        </span>
      </span>

      <span data-slot="itemTrailing" :class="b('item-trailing')">
        <slot name="item-trailing" :item="item" :index="index">
          <span
            v-if="item.children && item.children.length > 0" data-slot="itemTrailingIcon"
            :class="b('item-arrow')"
          >
            <Icon :name="childrenIcon" :size="16" />
          </span>

          <span v-else-if="item.kbds?.length" data-slot="itemTrailingKbds" :class="b('item-kbds')">
            <kbd v-for="(kbd, kbdIndex) in item.kbds" :key="kbdIndex">{{ kbd }}</kbd>
          </span>
        </slot>

        <ListboxItemIndicator v-if="!item.children?.length" as-child>
          <span data-slot="itemSelectedIcon" :class="b('item-selected')">
            <Icon :name="selectedIcon" :size="14" />
          </span>
        </ListboxItemIndicator>
      </span>
    </ListboxItem>
  </DefineItemTemplate>

  <ListboxRoot
    ref="rootRef" :disabled="disabled" highlight-on-hover selection-behavior="replace" data-slot="root"
    :class="b()"
  >
    <div data-slot="input-wrapper" :class="b('input-wrapper')">
      <ListboxFilter v-model="searchTerm" as-child>
        <div :class="b('input-row')">
          <button
            v-if="history?.length && back" :class="b('back-btn')" :aria-label="t('commandPalette.back')"
            data-slot="back" @click="navigateBack"
          >
            <Icon :name="backIcon" :size="16" />
          </button>

          <span v-if="loading" data-slot="searchIcon" :class="b('search-icon', { loading: true })">
            <Icon :name="loadingIcon" :size="16" />
          </span>
          <span v-else data-slot="searchIcon" :class="b('search-icon')">
            <Icon :name="icon" :size="16" />
          </span>

          <input
            :class="b('input')" :placeholder="placeholder" :autofocus="autofocus" data-slot="input"
            @keydown.backspace="onBackspace"
          >

          <button
            v-if="close" :class="b('close-btn')" :aria-label="t('commandPalette.close')" data-slot="close"
            @click="emit('update:open', false)"
          >
            <Icon :name="closeIcon" :size="14" />
          </button>
        </div>
      </ListboxFilter>
    </div>

    <ListboxContent data-slot="content" :class="b('content')">
      <div v-if="filteredGroups?.length" data-slot="viewport" :class="b('viewport')">
        <ListboxVirtualizer
          v-if="!!virtualize" v-slot="{ option: item, virtualItem }" :options="filteredItems"
          :text-content="(item: any) => get(item, labelKey)" v-bind="virtualizerProps"
        >
          <ReuseItemTemplate :item="item" :index="virtualItem.index" />
        </ListboxVirtualizer>

        <template v-else>
          <ListboxGroup v-for="group in filteredGroups" :key="`group-${group.id}`" data-slot="group" :class="b('group')">
            <ListboxGroupLabel v-if="group.label" data-slot="label" :class="b('group-label')">
              {{ group.label }}
            </ListboxGroupLabel>

            <ReuseItemTemplate
              v-for="(item, index) in group.items" :key="`group-${group.id}-${index}`" :item="item"
              :index="index"
            />
          </ListboxGroup>
        </template>
      </div>

      <div v-else data-slot="empty" :class="b('empty')">
        <slot name="empty" :search-term="searchTerm">
          <template v-if="searchTerm">
            {{ t("commandPalette.emptySearch", { searchTerm }) }}
          </template>
          <template v-else>
            {{ t("commandPalette.empty") }}
          </template>
        </slot>
      </div>
    </ListboxContent>

    <div v-if="!!slots.footer" data-slot="footer" :class="b('footer')">
      <slot name="footer" />
    </div>
  </ListboxRoot>
</template>

<style lang="scss">
@use "./command-palette.styles.scss" as *;
</style>
