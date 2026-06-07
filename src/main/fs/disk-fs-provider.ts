import { dirname } from "node:path";
import { constants, promises as fs, watch as fsWatch } from "node:fs";

import type { IFileSystemProvider, Stat, URI } from "~/common/fs";

import { FileSystemProviderCapabilities, FileType, FileUri } from "~/common/fs";

export class DiskFileSystemProvider implements IFileSystemProvider {
  readonly capabilities
    = FileSystemProviderCapabilities.ReadWrite
      | FileSystemProviderCapabilities.FileOpenReadWriteClose
      | FileSystemProviderCapabilities.FileFolderCopy
      | FileSystemProviderCapabilities.PathCaseSensitive;

  private handles = new Map<number, { path: string; fd: fs.FileHandle }>();
  private handleSeq = 0;

  async stat(resource: URI): Promise<Stat> {
    const path = FileUri.fsPath(resource);
    const lstats = await fs.lstat(path);

    let type = FileType.Unknown;

    if (lstats.isSymbolicLink()) {
      type = FileType.SymbolicLink;
      try {
        const stats = await fs.stat(path);
        if (stats.isDirectory())
          type |= FileType.Directory;
        else if (stats.isFile())
          type |= FileType.File;
      }
      catch {
        // dangling symlink — оставляем SymbolicLink
      }
    }
    else {
      if (lstats.isDirectory())
        type = FileType.Directory;
      else if (lstats.isFile())
        type = FileType.File;
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
    console.log("[DiskFileSystemProvider] readdir:", path);
    const entries = await fs.readdir(path, { withFileTypes: true });

    return entries.map((entry) => {
      let type = FileType.Unknown;
      if (entry.isDirectory())
        type = FileType.Directory;
      else if (entry.isFile())
        type = FileType.File;
      else if (entry.isSymbolicLink())
        type = FileType.SymbolicLink;
      return [entry.name, type];
    });
  }

  async open(resource: URI, opts?: { create?: boolean }): Promise<number> {
    const path = FileUri.fsPath(resource);
    const flag = opts?.create ? "w+" : "r";
    const fd = await fs.open(path, flag);
    const handle = ++this.handleSeq;
    this.handles.set(handle, { path, fd });
    return handle;
  }

  async close(fd: number): Promise<void> {
    const handle = this.handles.get(fd);
    if (!handle) {
      throw new Error(`Invalid file handle ${fd}`);
    }
    this.handles.delete(fd);
    await handle.fd.close();
  }

  async read(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
    const handle = this.handles.get(fd);
    if (!handle) {
      throw new Error(`Invalid file handle ${fd}`);
    }
    const { bytesRead } = await handle.fd.read(data, offset, length, pos);
    return bytesRead;
  }

  async write(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
    const handle = this.handles.get(fd);
    if (!handle) {
      throw new Error(`Invalid file handle ${fd}`);
    }
    const { bytesWritten } = await handle.fd.write(data, offset, length, pos);
    return bytesWritten;
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

  async mkdir(resource: URI): Promise<void> {
    const path = FileUri.fsPath(resource);
    await fs.mkdir(path, { recursive: true });
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

  async statfs(resource: URI): Promise<{ free: number; total: number }> {
    const path = FileUri.fsPath(resource);
    const stats = await fs.statfs(path);
    return {
      free: stats.bavail * stats.bsize,
      total: stats.blocks * stats.bsize,
    };
  }

  watch(resource: URI): () => void {
    const path = FileUri.fsPath(resource);
    const watcher = fsWatch(path, { recursive: false }, () => {
      // Callback reserved for future event propagation
    });

    return () => watcher.close();
  }
}
