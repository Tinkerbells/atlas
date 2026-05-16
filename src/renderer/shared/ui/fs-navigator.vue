<script setup lang="ts">
import { computed, ref } from "vue";

import type { FileListEntry } from "./file-list.vue";

import FileList from "./file-list.vue";
import NavigatorLayout from "./navigator-layout.vue";

const props = defineProps<{
  initialPath?: string;
}>();

const currentPath = ref(props.initialPath ?? "/");

const fsData: Record<string, FileListEntry[]> = {
  "/": [
    { id: "home", name: "home", isDirectory: true, isSymbolicLink: false },
    { id: "etc", name: "etc", isDirectory: true, isSymbolicLink: false },
    { id: "var", name: "var", isDirectory: true, isSymbolicLink: false },
    { id: "usr", name: "usr", isDirectory: true, isSymbolicLink: false },
    { id: "README.md", name: "README.md", isDirectory: false, isSymbolicLink: false },
  ],
  "/home": [
    { id: "user", name: "user", isDirectory: true, isSymbolicLink: false },
    { id: "voiduser", name: "voiduser", isDirectory: true, isSymbolicLink: false },
  ],
  "/home/voiduser": [
    { id: "projects", name: "projects", isDirectory: true, isSymbolicLink: false },
    { id: "documents", name: "documents", isDirectory: true, isSymbolicLink: false },
    { id: "downloads", name: "downloads", isDirectory: true, isSymbolicLink: false },
    { id: ".bashrc", name: ".bashrc", isDirectory: false, isSymbolicLink: false },
  ],
  "/home/voiduser/projects": [
    { id: "atlas", name: "atlas", isDirectory: true, isSymbolicLink: false },
    { id: "dotfiles", name: "dotfiles", isDirectory: true, isSymbolicLink: false },
  ],
  "/home/voiduser/projects/atlas": [
    { id: "src", name: "src", isDirectory: true, isSymbolicLink: false },
    { id: "docs", name: "docs", isDirectory: true, isSymbolicLink: false },
    { id: "package.json", name: "package.json", isDirectory: false, isSymbolicLink: false },
    { id: "README.md", name: "README.md", isDirectory: false, isSymbolicLink: false },
  ],
  "/home/voiduser/empty": [],
};

const entries = computed<FileListEntry[]>(() => fsData[currentPath.value] ?? []);

const paneTitle = computed(() => {
  if (currentPath.value === "/")
    return "Root";
  const parts = currentPath.value.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "Unknown";
});

const paneGroups = computed(() => [
  {
    id: "main",
    isActive: true,
    panes: [
      {
        id: "pane-current",
        type: 1,
        title: paneTitle.value,
        isActive: true,
      },
    ],
  },
]);

const breadcrumbParts = computed(() => {
  if (currentPath.value === "/")
    return [{ label: "Root", path: "/" }];

  const parts = currentPath.value.split("/").filter(Boolean);
  const result = [{ label: "Root", path: "/" }];
  let builtPath = "";

  for (const part of parts) {
    builtPath += `/${part}`;
    result.push({ label: part, path: builtPath });
  }

  return result;
});

function goUp(): void {
  if (currentPath.value === "/")
    return;
  const parts = currentPath.value.split("/").filter(Boolean);
  parts.pop();
  currentPath.value = parts.length === 0 ? "/" : `/${parts.join("/")}`;
}

function navigateToPath(path: string): void {
  currentPath.value = path;
}

function onEntryDblClick(entry: FileListEntry): void {
  if (entry.isDirectory) {
    currentPath.value = currentPath.value === "/"
      ? `/${entry.name}`
      : `${currentPath.value}/${entry.name}`;
  }
}
</script>

<template>
  <NavigatorLayout :pane-groups="paneGroups" :active-pane-title="currentPath">
    <template #group-0>
      <div class="flex flex-col flex-1 overflow-hidden">
        <!-- Toolbar / Breadcrumb bar -->
        <div class="flex items-center gap-2 px-3 py-2 border-b bg-surface">
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            class="shrink-0"
            :disabled="currentPath === '/'"
            @click="goUp"
          >
            <UIcon name="i-lucide-arrow-up" class="w-4 h-4" />
          </UButton>

          <div class="h-4 w-px bg-gray-300 shrink-0" />

          <!-- Custom Breadcrumb -->
          <nav class="flex-1 min-w-0 flex items-center gap-1 text-sm overflow-hidden">
            <template v-for="(part, index) in breadcrumbParts" :key="part.path">
              <button
                class="breadcrumb-item px-1.5 py-0.5 rounded-md transition-colors shrink-0"
                :class="index === breadcrumbParts.length - 1 ? 'text-foreground font-medium' : 'text-muted hover:text-foreground hover:bg-[var(--color-bg-elevated)]'"
                @click="navigateToPath(part.path)"
              >
                <span v-if="index === 0" class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-folder" class="w-3.5 h-3.5" />
                  <span class="truncate">{{ part.label }}</span>
                </span>
                <span v-else class="truncate">{{ part.label }}</span>
              </button>
              <UIcon
                v-if="index < breadcrumbParts.length - 1"
                name="i-lucide-chevron-right"
                class="w-3.5 h-3.5 text-muted shrink-0"
              />
            </template>
          </nav>
        </div>

        <!-- File list -->
        <FileList :entries="entries" @entry-dblclick="onEntryDblClick" />
      </div>
    </template>
  </NavigatorLayout>
</template>

<style scoped lang="scss">
.breadcrumb-item {
  max-width: 160px;
}
</style>
