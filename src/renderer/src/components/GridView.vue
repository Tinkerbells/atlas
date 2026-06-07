<script setup lang="ts">
import { ContextMenuContent, ContextMenuItem, ContextMenuRoot, ContextMenuTrigger } from "reka-ui";

import type { FileEntry } from "../stores/fs-store";

import Icon from "./ui/Icon.vue";
import { useFsStore } from "../stores/fs-store";
import { useFileSelection } from "../composables/useFileSelection";

const emit = defineEmits<{
  entryClick: [entry: FileEntry, event: MouseEvent];
  entryDoubleClick: [entry: FileEntry];
  contextAction: [value: string, entry: FileEntry];
}>();
const store = useFsStore();
const { isSelected } = useFileSelection();

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
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4 p-4 content-start">
    <ContextMenuRoot
      v-for="entry in store.entries"
      :key="entry.name"
    >
      <ContextMenuTrigger as-child>
        <div
          class="group flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50"
          :class="[
            isSelected(entry.name) ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800' : '',
          ]"
          @click="(e: MouseEvent) => emit('entryClick', entry, e)"
          @dblclick="emit('entryDoubleClick', entry)"
        >
          <Icon
            :name="getEntryIcon(entry)"
            class="size-12 shrink-0"
            :class="[
              entry.isDirectory ? 'text-blue-500' : 'text-gray-400',
            ]"
          />
          <span class="text-xs text-center leading-tight break-all line-clamp-2 w-full">
            {{ entry.name }}
          </span>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent class="min-w-40 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-1 z-50">
        <ContextMenuItem
          v-for="item in getContextMenuItems(entry)"
          :key="item.value"
          class="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer select-none outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
          :class="item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'"
          @select="emit('contextAction', item.value, entry)"
        >
          <Icon :name="item.icon" class="size-4" />
          {{ item.label }}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuRoot>
  </div>
</template>
