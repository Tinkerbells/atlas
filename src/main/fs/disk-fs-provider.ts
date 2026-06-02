import { promises as fs, watch as fsWatch, constants } from "node:fs";
import { dirname } from "node:path";

import { FileUri, URI } from "~/common/fs";
import { FileSystemProviderCapabilities, FileType } from "~/common/fs";
import type { IFileSystemProvider, Stat } from "~/common/fs";

export class DiskFileSystemProvider implements IFileSystemProvider {
  readonly capabilities
    = FileSystemProviderCapabilities.ReadWrite
    | FileSystemProviderCapabilities.FileFolderCopy
    | FileSystemProviderCapabilities.PathCaseSensitive;

  async stat(resource: URI): Promise<Stat> {
    const path = FileUri.fsPath(resource);
    const lstats = await fs.lstat(path);

    let type = FileType.Unknown;

    if (lstats.isSymbolicLink()) {
      type = FileType.SymbolicLink;
      try {
        const stats = await fs.stat(path);
        if (stats.isDirectory()) type |= FileType.Directory;
        else if (stats.isFile()) type |= FileType.File;
      }
      catch {
        // dangling symlink — оставляем SymbolicLink
      }
    }
    else {
      if (lstats.isDirectory()) type = FileType.Directory;
      else if (lstats.isFile()) type = FileType.File;
    }

    return {
      type,
      ctime: lstats.ctimeMs,
      mtime: lstats.mtimeMs,
      size: lstats.size,
    };
  }

  async readdir(resource: URI): Promise<[string, FileType][]> {
    const path = FileUri.fsPath(resource);
    const entries = await fs.readdir(path, { withFileTypes: true });

    return entries.map((entry) => {
      let type = FileType.Unknown;
      if (entry.isDirectory()) type = FileType.Directory;
      else if (entry.isFile()) type = FileType.File;
      else if (entry.isSymbolicLink()) type = FileType.SymbolicLink;
      return [entry.name, type];
    });
  }

  async readFile(resource: URI): Promise<Uint8Array> {
    const path = FileUri.fsPath(resource);
    const buffer = await fs.readFile(path);
    return new Uint8Array(buffer);
  }

  async writeFile(resource: URI, content: Uint8Array): Promise<void> {
    const path = FileUri.fsPath(resource);
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, content);
  }

  async delete(
    resource: URI,
    options?: { recursive?: boolean; useTrash?: boolean },
  ): Promise<void> {
    const path = FileUri.fsPath(resource);
    const stats = await fs.lstat(path);

    if (stats.isDirectory()) {
      await fs.rm(path, { recursive: options?.recursive, force: true });
    }
    else {
      await fs.unlink(path);
    }
  }

  async rename(
    from: URI,
    to: URI,
    _options?: { overwrite?: boolean },
  ): Promise<void> {
    const fromPath = FileUri.fsPath(from);
    const toPath = FileUri.fsPath(to);

    await fs.mkdir(dirname(toPath), { recursive: true });
    await fs.rename(fromPath, toPath);
  }

  async copy(
    from: URI,
    to: URI,
    options?: { overwrite?: boolean },
  ): Promise<void> {
    const fromPath = FileUri.fsPath(from);
    const toPath = FileUri.fsPath(to);

    await fs.mkdir(dirname(toPath), { recursive: true });

    if (options?.overwrite) {
      await fs.copyFile(fromPath, toPath);
    }
    else {
      await fs.copyFile(fromPath, toPath, constants.COPYFILE_EXCL);
    }
  }

  watch(resource: URI): () => void {
    const path = FileUri.fsPath(resource);
    const watcher = fsWatch(path, { recursive: false }, () => {
      // Callback reserved for future event propagation
    });

    return () => watcher.close();
  }
}
