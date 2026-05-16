<script setup lang="ts">
import type { URI } from "@platform/common/uri/uri";
import type { IFileStat } from "@platform/files/common/files";
import type { FileListEntry } from "@renderer/shared/ui/file-list.vue";

import { computed, ref, watch } from "vue";
import FileList from "@renderer/shared/ui/file-list.vue";
import { URI as UriClass } from "@platform/common/uri/uri";
import { IFileService } from "@platform/files/common/files";
import { useService } from "@renderer/composables/use-service";
import { INavigatorService, PaneType } from "@renderer/navigator";
import FileContextMenu from "@renderer/components/file-context-menu.vue";

const props = defineProps<{
  resource?: URI;
}>();

const fileService = useService(IFileService);
const navigatorService = useService(INavigatorService);

const entries = ref<IFileStat[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function loadDirectory(): Promise<void> {
  if (!props.resource) {
    entries.value = [];
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const stat = await fileService.resolve(props.resource);
    entries.value = stat.children ?? [];
  }
  catch (e) {
    console.error("[PaneExplorer] readDirectory error:", e);
    entries.value = [];
    error.value = e instanceof Error ? e.message : String(e);
  }
  finally {
    loading.value = false;
  }
}

watch(() => props.resource, loadDirectory, { immediate: true });

const fileListEntries = computed<FileListEntry[]>(() => {
  return entries.value.map(entry => ({
    id: entry.resource.toString(),
    name: entry.name,
    isDirectory: entry.isDirectory,
    isSymbolicLink: entry.isSymbolicLink,
  }));
});

const entryMap = computed(() => {
  const map = new Map<string, IFileStat>();
  for (const entry of entries.value) {
    map.set(entry.resource.toString(), entry);
  }
  return map;
});

function handleEntryDblClick(fileListEntry: FileListEntry): void {
  const entry = entryMap.value.get(fileListEntry.id);
  if (!entry)
    return;

  const uri = UriClass.revive(entry.resource);
  if (entry.isDirectory) {
    navigatorService.navigateActivePane(uri);
  }
  else {
    navigatorService.openPane(uri, { type: PaneType.Preview, title: entry.name });
  }
}
</script>

<template>
  <FileList
    :entries="fileListEntries"
    :loading="loading"
    :error="error"
    @entry-dblclick="handleEntryDblClick"
  >
    <template #item="{ entry, getIcon, getIconColor, isSelected }">
      <FileContextMenu
        :resource="props.resource"
        :entry="entryMap.get(entry.id)"
        @refresh="loadDirectory"
      >
        <div
          class="file-list-row flex items-center gap-3 px-3 py-2 mx-1 rounded-md cursor-pointer select-none transition-colors"
          :class="{ 'is-selected': isSelected }"
          @dblclick="handleEntryDblClick(entry)"
        >
          <UIcon
            :name="getIcon(entry)"
            class="w-[18px] h-[18px] shrink-0"
            :class="getIconColor(entry)"
          />
          <span class="text-sm truncate text-foreground">{{ entry.name }}</span>
          <span v-if="entry.isSymbolicLink" class="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 font-medium shrink-0">
            symlink
          </span>
        </div>
      </FileContextMenu>
    </template>
  </FileList>
</template>
