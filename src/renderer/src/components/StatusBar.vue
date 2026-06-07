<script setup lang="ts">
import { useFsStore } from "../stores/fs-store";

const store = useFsStore();

function formatSize(bytes: number): string {
  if (bytes === 0)
    return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
</script>

<template>
  <footer class="flex items-center gap-4 px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500">
    <span>{{ store.entries.length }} items</span>
    <span v-if="store.freeSpace > 0">
      Free space: {{ formatSize(store.freeSpace) }}
    </span>
  </footer>
</template>
