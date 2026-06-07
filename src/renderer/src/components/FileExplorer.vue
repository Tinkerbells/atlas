<script setup lang="ts">
import { onMounted } from "vue";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRoot,
  ContextMenuTrigger,
} from "reka-ui";

import type { FileEntry } from "../stores/fs-store";

import Icon from "./ui/Icon.vue";
import Alert from "./ui/Alert.vue";
import Sidebar from "./Sidebar.vue";
import Button from "./ui/Button.vue";
import GridView from "./GridView.vue";
import StatusBar from "./StatusBar.vue";
import Breadcrumb from "./ui/Breadcrumb.vue";
import { useFsStore } from "../stores/fs-store";
import { useFileExplorer } from "../composables/useFileExplorer";
import { useFileSelection } from "../composables/useFileSelection";
import { useFileOperations } from "../composables/useFileOperations";

const store = useFsStore();
const { loadDirectory, navigateUp, navigateTo } = useFileExplorer();
const { select, isSelected } = useFileSelection();
const { deleteSelected } = useFileOperations();

function getContextMenuItems(_entry: FileEntry) {
  return [
    { label: "Open", icon: "i-lucide-folder-open", value: "open" },
    { label: "Rename", icon: "i-lucide-pencil", value: "rename" },
    { label: "Copy", icon: "i-lucide-copy", value: "copy" },
    { label: "Cut", icon: "i-lucide-scissors", value: "cut" },
    { label: "Delete", icon: "i-lucide-trash", value: "delete", danger: true },
    { label: "Properties", icon: "i-lucide-info", value: "properties" },
  ];
}

async function handleContextMenuAction(value: string, entry: FileEntry): Promise<void> {
  if (value === "open") {
    onEntryDoubleClick(entry);
  }
  else if (value === "delete") {
    select(entry.name, false);
    // eslint-disable-next-line no-alert
    if (window.confirm(`Delete "${entry.name}"?`)) {
      await deleteSelected();
    }
  }
}

function getEntryIcon(entry: FileEntry): string {
  if (entry.isDirectory)
    return "i-lucide-folder";
  if (entry.name.endsWith(".pdf"))
    return "i-lucide-file-text";
  if (/\.(?:jpg|jpeg|png|gif|webp|svg)$/i.test(entry.name))
    return "i-lucide-image";
  if (/\.(?:mp4|mov|avi|mkv)$/i.test(entry.name))
    return "i-lucide-video";
  if (/\.(?:mp3|wav|flac|aac)$/i.test(entry.name))
    return "i-lucide-music";
  if (/\.(?:js|ts|vue|html|css|json|md)$/i.test(entry.name))
    return "i-lucide-file-code";
  if (/\.(?:deb|rpm|pkg|exe|dmg|AppImage)$/i.test(entry.name))
    return "i-lucide-package";
  return "i-lucide-file";
}

function formatSize(bytes: number): string {
  if (bytes === 0)
    return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(timestamp: number): string {
  if (timestamp === 0)
    return "-";
  return new Date(timestamp).toLocaleString();
}

function onEntryClick(entry: FileEntry, event: MouseEvent): void {
  select(entry.name, event.ctrlKey || event.metaKey);
}

function onEntryDoubleClick(entry: FileEntry): void {
  if (entry.isDirectory) {
    const uri = store.currentPath === "/"
      ? `/${entry.name}`
      : `${store.currentPath}/${entry.name}`;
    navigateTo(uri);
  }
}

onMounted(() => {
  loadDirectory("/");
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
      <Button
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-arrow-up"
        :disabled="store.currentPath === '/'"
        @click="navigateUp"
      />

      <Breadcrumb
        :items="store.breadcrumbs"
        class="flex-1 min-w-0"
        @navigate="navigateTo"
      />

      <div class="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-2">
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          :icon="store.viewMode === 'grid' ? 'i-lucide-layout-grid' : 'i-lucide-list'"
          @click="store.setViewMode(store.viewMode === 'grid' ? 'list' : 'grid')"
        />
      </div>

      <div class="flex items-center gap-2 text-sm text-gray-500 pl-2 border-l border-gray-200 dark:border-gray-700">
        <Icon
          v-if="store.isRefreshing"
          name="i-lucide-loader"
          class="size-4 animate-spin"
        />
        <span>{{ store.entries.length }} items</span>
      </div>
    </div>

    <!-- Main area -->
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <Sidebar @navigate="navigateTo" />

      <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- Error -->
        <Alert
          v-if="store.error"
          color="error"
          :title="store.error"
          class="m-3 shrink-0"
          closable
          @close="store.setError(null)"
        />

        <!-- Loading -->
        <div v-if="store.isLoading" class="flex-1 flex items-center justify-center">
          <Icon name="i-lucide-loader" class="size-8 animate-spin text-gray-400" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="store.entries.length === 0"
          class="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2"
        >
          <Icon name="i-lucide-folder-open" class="size-12 opacity-50" />
          <p>This folder is empty</p>
        </div>

        <!-- Grid View -->
        <div v-else-if="store.viewMode === 'grid'" class="flex-1 overflow-auto">
          <GridView
            @entry-click="onEntryClick"
            @entry-double-click="onEntryDoubleClick"
            @context-action="handleContextMenuAction"
          />
        </div>

        <!-- List View -->
        <div v-else class="flex-1 overflow-auto">
          <table class="w-full">
            <thead class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="text-left px-4 py-2 text-sm font-medium text-gray-500 w-full">
                  Name
                </th>
                <th class="text-right px-4 py-2 text-sm font-medium text-gray-500 whitespace-nowrap">
                  Size
                </th>
                <th class="text-right px-4 py-2 text-sm font-medium text-gray-500 whitespace-nowrap">
                  Modified
                </th>
              </tr>
            </thead>
            <tbody>
              <ContextMenuRoot
                v-for="entry in store.entries"
                :key="entry.name"
              >
                <ContextMenuTrigger as-child>
                  <tr
                    class="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    :class="[
                      isSelected(entry.name) ? 'bg-blue-50 dark:bg-blue-900/20' : '',
                    ]"
                    @click="onEntryClick(entry, $event)"
                    @dblclick="onEntryDoubleClick(entry)"
                  >
                    <td class="px-4 py-2">
                      <div class="flex items-center gap-3">
                        <Icon
                          :name="getEntryIcon(entry)"
                          class="size-5"
                          :class="[
                            entry.isDirectory ? 'text-blue-500' : 'text-gray-400',
                          ]"
                        />
                        <span class="text-sm">{{ entry.name }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-2 text-right text-sm text-gray-500 whitespace-nowrap">
                      {{ formatSize(entry.size) }}
                    </td>
                    <td class="px-4 py-2 text-right text-sm text-gray-500 whitespace-nowrap">
                      {{ formatDate(entry.mtime) }}
                    </td>
                  </tr>
                </ContextMenuTrigger>

                <ContextMenuContent class="min-w-40 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-1 z-50">
                  <ContextMenuItem
                    v-for="item in getContextMenuItems(entry)"
                    :key="item.value"
                    class="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer select-none outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                    :class="item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'"
                    @select="handleContextMenuAction(item.value, entry)"
                  >
                    <Icon :name="item.icon" class="size-4" />
                    {{ item.label }}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenuRoot>
            </tbody>
          </table>
        </div>

        <StatusBar />
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  border-collapse: collapse;
}

tbody tr {
  border-bottom: 1px solid hsl(var(--color-border, 220 13% 91%));
}
</style>
