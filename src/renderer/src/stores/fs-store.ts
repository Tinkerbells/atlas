import { computed, ref } from "vue";
import { defineStore } from "pinia";

import type { FileType } from "~/common/fs/fs-provider";

export interface FileEntry {
  name: string;
  type: FileType;
  size: number;
  mtime: number;
  isDirectory: boolean;
  isFile: boolean;
}

export const useFsStore = defineStore("fs", () => {
  const currentPath = ref<string>("/");
  const entries = ref<FileEntry[]>([]);
  const isLoading = ref(false);
  const isRefreshing = ref(false);
  const error = ref<string | null>(null);
  const selectedNames = ref<Set<string>>(new Set());
  const viewMode = ref<"list" | "grid">("grid");
  const freeSpace = ref<number>(0);

  const breadcrumbs = computed(() => {
    const parts = currentPath.value.split("/").filter(Boolean);
    const result: { label: string; path: string }[] = [{ label: "Home", path: "/" }];
    let current = "";
    for (const part of parts) {
      current += `/${part}`;
      result.push({ label: part, path: current });
    }
    return result;
  });

  const selectedEntries = computed(() =>
    entries.value.filter(e => selectedNames.value.has(e.name)),
  );

  function select(name: string, multi: boolean = false) {
    if (multi) {
      if (selectedNames.value.has(name)) {
        selectedNames.value.delete(name);
      }
      else {
        selectedNames.value.add(name);
      }
    }
    else {
      selectedNames.value = new Set([name]);
    }
  }

  function selectAll() {
    selectedNames.value = new Set(entries.value.map(e => e.name));
  }

  function clearSelection() {
    selectedNames.value = new Set();
  }

  function setEntries(newEntries: FileEntry[]) {
    entries.value = newEntries;
  }

  function setPath(path: string) {
    currentPath.value = path;
  }

  function setLoading(value: boolean) {
    isLoading.value = value;
  }

  function setRefreshing(value: boolean) {
    isRefreshing.value = value;
  }

  function setError(err: string | null) {
    error.value = err;
  }

  function setViewMode(mode: "list" | "grid") {
    viewMode.value = mode;
  }

  function setFreeSpace(bytes: number) {
    freeSpace.value = bytes;
  }

  return {
    currentPath,
    entries,
    isLoading,
    isRefreshing,
    error,
    selectedNames,
    viewMode,
    freeSpace,
    breadcrumbs,
    selectedEntries,
    select,
    selectAll,
    clearSelection,
    setEntries,
    setPath,
    setLoading,
    setRefreshing,
    setError,
    setViewMode,
    setFreeSpace,
  };
});
