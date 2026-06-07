import { onScopeDispose } from "vue";

import { FileUri } from "~/common/fs";
import { FileType } from "~/common/fs/fs-provider";

import type { FileEntry } from "../stores/fs-store";

import { useFsProvider } from "./useFsProvider";
import { useFsStore } from "../stores/fs-store";

export function useFileExplorer() {
  const fs = useFsProvider();
  const store = useFsStore();

  // Auto-refresh when the file system reports changes (event-driven, VS Code-style)
  const changeListener = fs.onDidChangeFile(() => {
    loadDirectory(store.currentPath, { silent: true });
  });
  onScopeDispose(() => changeListener.dispose());

  async function loadDirectory(path: string, { silent = false } = {}): Promise<void> {
    if (!silent) {
      store.setLoading(true);
    }
    store.setRefreshing(true);
    store.setError(null);
    store.clearSelection();

    try {
      await fs.ready;
      const uri = FileUri.create(path);
      const dirEntries = await fs.readdir(uri);

      const fileEntries: FileEntry[] = [];
      for (const [name, type] of dirEntries) {
        try {
          const entryUri = uri.resolve(name);
          const stat = await fs.stat(entryUri);
          fileEntries.push({
            name,
            type: stat.type,
            size: stat.size,
            mtime: stat.mtime,
            isDirectory: (stat.type & FileType.Directory) !== 0,
            isFile: (stat.type & FileType.File) !== 0,
          });
        }
        catch {
          fileEntries.push({
            name,
            type,
            size: 0,
            mtime: 0,
            isDirectory: (type & FileType.Directory) !== 0,
            isFile: (type & FileType.File) !== 0,
          });
        }
      }

      // Sort: directories first, then by name
      const sorted = fileEntries.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory)
          return -1;
        if (!a.isDirectory && b.isDirectory)
          return 1;
        return a.name.localeCompare(b.name);
      });

      store.setEntries(sorted);
      store.setPath(path);

      // Get free space for current directory
      try {
        const statfs = await fs.statfs(uri);
        store.setFreeSpace(statfs.free);
      }
      catch {
        // ignore if statfs is not supported
      }
    }
    catch (err) {
      store.setError(err instanceof Error ? err.message : String(err));
    }
    finally {
      store.setRefreshing(false);
      if (!silent) {
        store.setLoading(false);
      }
    }
  }

  function navigateTo(path: string): void {
    loadDirectory(path, { silent: true });
  }

  function navigateUp(): void {
    const uri = FileUri.create(store.currentPath);
    const parent = uri.parent;
    if (parent && parent.path !== uri.path) {
      loadDirectory(parent.path || "/", { silent: true });
    }
  }

  return {
    loadDirectory,
    navigateTo,
    navigateUp,
  };
}
