import type { URI } from "@platform/common/uri/uri";

import { ref } from "vue";

export interface FileClipboardEntry {
  resource: URI;
  name: string;
  isDirectory: boolean;
}

const clipboard = ref<{
  entries: FileClipboardEntry[];
  action: "copy" | "cut";
} | null>(null);

export function useFileClipboard() {
  function copy(entries: FileClipboardEntry[]): void {
    clipboard.value = { entries, action: "copy" };
  }

  function cut(entries: FileClipboardEntry[]): void {
    clipboard.value = { entries, action: "cut" };
  }

  function clear(): void {
    clipboard.value = null;
  }

  function canPaste(): boolean {
    return clipboard.value !== null && clipboard.value.entries.length > 0;
  }

  return {
    clipboard,
    copy,
    cut,
    clear,
    canPaste,
  };
}
