<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";
import type { URI } from "@platform/common/uri/uri";

import { computed } from "vue";
import { INavigatorService } from "@renderer/navigator";
import { URI as UriClass } from "@platform/common/uri/uri";
import { useService } from "@renderer/composables/use-service";

const props = defineProps<{
  resource?: URI;
}>();

const navigatorService = useService(INavigatorService);

const items = computed((): BreadcrumbItem[] => {
  if (!props.resource)
    return [];

  const path = props.resource.path;
  if (!path || path === "/")
    return [{ label: "/", icon: "i-lucide-hard-drive", to: undefined }];

  const parts = path.split("/").filter(Boolean);
  const result: BreadcrumbItem[] = [];

  let currentPath = "";
  for (let i = 0; i < parts.length; i++) {
    currentPath += `/${parts[i]}`;
    result.push({
      label: parts[i]!,
      icon: "i-lucide-folder",
      to: currentPath,
    });
  }

  return result;
});

function onSegmentClick(path: string): void {
  const uri = UriClass.file(path);
  navigatorService.navigateActivePane(uri);
}
</script>

<template>
  <UBreadcrumb :items="items">
    <template #item="{ item, active }">
      <button
        class="flex items-center gap-1 text-sm transition-colors select-none"
        :class="active
          ? 'font-semibold text-primary'
          : 'text-muted font-medium hover:text-default'"
        @click="onSegmentClick(item.to as string)"
      >
        <span :class="item.icon" class="shrink-0 size-4" />
        <span class="truncate">{{ item.label }}</span>
      </button>
    </template>
  </UBreadcrumb>
</template>
