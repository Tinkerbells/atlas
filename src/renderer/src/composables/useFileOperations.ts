import { FileUri } from "~/common/fs";

import { useFsStore } from "../stores/fs-store";
import { useFsProvider } from "./useFsProvider";
import { useToastStore } from "../stores/toast-store";

export function useFileOperations() {
  const fs = useFsProvider();
  const store = useFsStore();
  const toast = useToastStore();

  async function deleteSelected(): Promise<void> {
    const names = Array.from(store.selectedNames);
    if (names.length === 0)
      return;

    const uri = FileUri.create(store.currentPath);
    await fs.ready;

    try {
      for (const name of names) {
        const entryUri = uri.resolve(name);
        await fs.delete(entryUri, { recursive: true });
      }
    }
    catch (err) {
      toast.add({
        title: "Delete failed",
        description: err instanceof Error ? err.message : String(err),
        color: "error",
      });
    }
  }

  async function renameEntry(oldName: string, newName: string): Promise<void> {
    const uri = FileUri.create(store.currentPath);
    await fs.ready;
    const from = uri.resolve(oldName);
    const to = uri.resolve(newName);

    try {
      await fs.rename(from, to);
    }
    catch (err) {
      toast.add({
        title: "Rename failed",
        description: err instanceof Error ? err.message : String(err),
        color: "error",
      });
    }
  }

  return {
    deleteSelected,
    renameEntry,
  };
}
