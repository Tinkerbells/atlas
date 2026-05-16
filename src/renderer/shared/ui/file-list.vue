<script setup lang="ts">
export interface FileListEntry {
  id: string;
  name: string;
  isDirectory: boolean;
  isSymbolicLink: boolean;
}

export interface FileListProps {
  entries?: FileListEntry[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  selectedId?: string | null;
}

withDefaults(defineProps<FileListProps>(), {
  entries: () => [],
  loading: false,
  error: null,
  emptyMessage: "This folder is empty",
  selectedId: null,
});

const emit = defineEmits<{
  (e: "entryClick", entry: FileListEntry): void;
  (e: "entryDblclick", entry: FileListEntry): void;
  (e: "entryContextmenu", entry: FileListEntry, event: MouseEvent): void;
}>();

function getIcon(entry: FileListEntry): string {
  if (entry.isDirectory)
    return "i-lucide-folder";
  if (entry.isSymbolicLink)
    return "i-lucide-file-symlink";
  return "i-lucide-file";
}

function getIconColor(entry: FileListEntry): string {
  if (entry.isDirectory)
    return "text-amber-500";
  if (entry.isSymbolicLink)
    return "text-violet-500";
  return "text-slate-400";
}

function onEntryClick(entry: FileListEntry): void {
  emit("entryClick", entry);
}

function onEntryDblClick(entry: FileListEntry): void {
  emit("entryDblclick", entry);
}

function onEntryContextMenu(entry: FileListEntry, event: MouseEvent): void {
  emit("entryContextmenu", entry, event);
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center px-3 py-2 text-xs font-medium text-muted border-b bg-surface select-none">
      <span class="flex-1 min-w-0">Name</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center flex-1 gap-3 p-8">
      <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin" />
      <span class="text-sm text-muted">Loading files...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center flex-1 gap-3 p-8">
      <div class="flex items-center justify-center w-12 h-12 rounded-full bg-error/10">
        <UIcon name="i-lucide-alert-circle" class="w-6 h-6 text-error" />
      </div>
      <span class="text-sm text-center text-foreground max-w-xs">{{ error }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="entries.length === 0" class="flex flex-col items-center justify-center flex-1 gap-3 p-8">
      <div class="flex items-center justify-center w-12 h-12 rounded-full bg-muted/50">
        <UIcon name="i-lucide-folder-open" class="w-6 h-6 text-muted" />
      </div>
      <span class="text-sm text-muted">{{ emptyMessage }}</span>
    </div>

    <!-- File list -->
    <div v-else class="flex flex-col overflow-auto flex-1 py-1">
      <template v-for="entry in entries" :key="entry.id">
        <slot
          name="item"
          :entry="entry"
          :is-selected="selectedId === entry.id"
          :get-icon="getIcon"
          :get-icon-color="getIconColor"
        >
          <div
            class="file-list-row flex items-center gap-3 px-3 py-2 mx-1 rounded-md cursor-pointer select-none transition-colors"
            :class="{ 'is-selected': selectedId === entry.id }"
            @click="onEntryClick(entry)"
            @dblclick="onEntryDblClick(entry)"
            @contextmenu="onEntryContextMenu(entry, $event)"
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
        </slot>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-list-row {
  &:hover {
    background-color: var(--color-bg-elevated);
  }

  &.is-selected {
    background-color: rgba(var(--color-primary-rgb), 0.1);

    .text-foreground {
      color: var(--color-primary);
      font-weight: 500;
    }
  }
}
</style>
