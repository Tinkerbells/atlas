<script setup lang="ts">
import type { URI } from "@platform/common/uri/uri";
import type { IFileStat } from "@platform/files/common/files";

import { ref, watch } from "vue";
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
  console.log("[PaneExplorer] loadDirectory called, resource:", props.resource?.toString(), "fsPath:", props.resource?.fsPath);

  if (!props.resource) {
    console.log("[PaneExplorer] no resource, clearing entries");
    entries.value = [];
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const stat = await fileService.resolve(props.resource);
    console.log("[PaneExplorer] resolve result:", stat.children?.length ?? 0, "entries");
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

function onEntryDblClick(entry: IFileStat): void {
  const uri = UriClass.revive(entry.resource);
  if (entry.isDirectory) {
    navigatorService.navigateActivePane(uri);
  }
  else {
    navigatorService.openPane(uri, { type: PaneType.Preview, title: entry.name });
  }
}

function getIcon(entry: IFileStat): string {
  if (entry.isDirectory)
    return "i-lucide-folder";
  if (entry.isSymbolicLink)
    return "i-lucide-file-symlink";
  return "i-lucide-file";
}
</script>

<template>
  <FileContextMenu :resource="props.resource" @refresh="loadDirectory">
    <div class="flex flex-col h-full">
      <div v-if="loading" class="flex items-center justify-center p-4 text-muted text-sm">
        <span class="i-lucide-loader-2 animate-spin w-4 h-4 mr-2" />
        Loading...
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center p-4 text-muted text-sm">
        <span class="i-lucide-alert-circle w-5 h-5 mb-2 text-destructive" />
        {{ error }}
      </div>

      <div v-else-if="entries.length === 0" class="flex items-center justify-center p-4 text-muted text-sm">
        Empty folder
      </div>

      <div v-else class="flex flex-col overflow-auto">
        <FileContextMenu
          v-for="entry in entries"
          :key="entry.resource.path"
          :resource="props.resource"
          :entry="entry"
          @refresh="loadDirectory"
        >
          <button
            class="flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors hover:bg-surface-hover select-none w-full"
            @contextmenu.stop
            @dblclick="onEntryDblClick(entry)"
          >
            <span :class="getIcon(entry)" class="w-4 h-4 text-muted" />
            <span class="truncate">{{ entry.name }}</span>
          </button>
        </FileContextMenu>
      </div>
    </div>
  </FileContextMenu>
</template>
