import { createReadStream } from "node:fs";

import type { CancellationToken } from "../../common/cancellation";
import type { FileReadStreamOptions, RemoteFileStreamError, RemoteFileSystemClient, RemoteFileSystemServer } from "../../common/fs/remote-fs-protocol";
import type { FileDeleteOptions, FileOpenOptions, FileOverwriteOptions, FileSystemProviderCapabilities, FileType, FileWriteOptions, IFileSystemProvider, Stat, WatchOptions } from "../../common/fs/fs-provider";

import { URI } from "../../common/fs/uri";
import { cancelled } from "../../common/cancellation";

export class FileSystemProviderServer implements RemoteFileSystemServer {
  private readonly BUFFER_SIZE = 64 * 1024;
  private watchers = new Map<number, { uri: string; options: WatchOptions; disposable: () => void }>();
  private client: RemoteFileSystemClient | undefined;
  private progressHandles = new Map<number, { current: number; total: number }>();

  constructor(private readonly provider: IFileSystemProvider) {}

  setClient(client: RemoteFileSystemClient | undefined): void {
    this.client = client;
  }

  getCapabilities(): Promise<FileSystemProviderCapabilities> {
    return Promise.resolve(this.provider.capabilities);
  }

  stat(resource: string): Promise<Stat> {
    return this.provider.stat(URI.parse(resource));
  }

  access(_resource: string, _mode?: number): Promise<void> {
    throw new Error("not supported");
  }

  fsPath(resource: string): Promise<string> {
    return Promise.resolve(URI.parse(resource).fsPath);
  }

  async open(resource: string, opts: FileOpenOptions): Promise<number> {
    if (!this.provider.open) {
      throw new Error("open not supported");
    }
    return this.provider.open(URI.parse(resource), opts);
  }

  async close(fd: number): Promise<void> {
    if (!this.provider.close) {
      throw new Error("close not supported");
    }
    return this.provider.close(fd);
  }

  async read(fd: number, pos: number, length: number): Promise<{ bytes: Uint8Array; bytesRead: number }> {
    if (!this.provider.read) {
      throw new Error("read not supported");
    }
    const buffer = new Uint8Array(this.BUFFER_SIZE);
    const bytesRead = await this.provider.read(fd, pos, buffer, 0, length);
    return { bytes: buffer.slice(0, bytesRead), bytesRead };
  }

  async write(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
    if (!this.provider.write) {
      throw new Error("write not supported");
    }
    return this.provider.write(fd, pos, data, offset, length);
  }

  readFile(resource: string): Promise<Uint8Array> {
    return this.provider.readFile(URI.parse(resource));
  }

  async readFileStream(resource: string, handle: number, opts: FileReadStreamOptions, token: CancellationToken): Promise<void> {
    const path = URI.parse(resource).fsPath;
    const stream = createReadStream(path, {
      start: opts.position,
      end: opts.length !== undefined && opts.length >= 0 ? (opts.position ?? 0) + opts.length : undefined,
      highWaterMark: opts.bufferSize ?? this.BUFFER_SIZE,
    });

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        stream.destroy();
        if (token.isCancellationRequested) {
          reject(cancelled());
        }
      };

      const tokenListener = token.onCancellationRequested(cleanup);

      stream.on("data", (chunk) => {
        if (typeof chunk === "string") {
          return;
        }
        if (token.isCancellationRequested) {
          cleanup();
          return;
        }
        this.client?.onFileStreamData(handle, new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      });

      stream.on("error", (err: Error) => {
        tokenListener.dispose();
        this.client?.onFileStreamEnd(handle, { name: err.name, message: err.message, stack: err.stack } as RemoteFileStreamError);
        reject(err);
      });

      stream.on("end", () => {
        tokenListener.dispose();
        this.client?.onFileStreamEnd(handle, undefined);
        resolve();
      });
    });
  }

  async writeFile(resource: string, content: Uint8Array, opts: FileWriteOptions): Promise<void> {
    await this.provider.writeFile(URI.parse(resource), content, opts);
    this.client?.notifyDidChangeFile({ changes: [{ type: 0, resource }] });
  }

  async delete(resource: string, opts: FileDeleteOptions): Promise<void> {
    await this.provider.delete(URI.parse(resource), opts);
    this.client?.notifyDidChangeFile({ changes: [{ type: 2, resource }] });
  }

  async mkdir(resource: string): Promise<void> {
    await this.provider.mkdir(URI.parse(resource));
    this.client?.notifyDidChangeFile({ changes: [{ type: 1, resource }] });
  }

  readdir(resource: string): Promise<[string, FileType][]> {
    return this.provider.readdir(URI.parse(resource));
  }

  async rename(source: string, target: string, opts: FileOverwriteOptions): Promise<void> {
    await this.provider.rename(URI.parse(source), URI.parse(target), opts);
    this.client?.notifyDidChangeFile({ changes: [{ type: 2, resource: source }, { type: 1, resource: target }] });
  }

  async copy(source: string, target: string, opts: FileOverwriteOptions, handle: number): Promise<void> {
    const fromPath = URI.parse(source).fsPath;
    const stats = await (await import("node:fs")).promises.stat(fromPath);
    this.progressHandles.set(handle, { current: 0, total: stats.size });
    try {
      if (this.provider.copy) {
        await this.provider.copy(URI.parse(source), URI.parse(target), opts);
      }
      else {
        throw new Error("copy not supported by provider");
      }
      this.client?.onProgress(handle, stats.size, stats.size);
    }
    finally {
      this.progressHandles.delete(handle);
    }
  }

  statfs(resource: string): Promise<{ free: number; total: number }> {
    if (!this.provider.statfs) {
      throw new Error("statfs not supported");
    }
    return this.provider.statfs(URI.parse(resource));
  }

  watch(watcher: number, resource: string, opts: WatchOptions): Promise<void> {
    const uri = URI.parse(resource);
    const disposable = this.provider.watch(uri);
    this.watchers.set(watcher, { uri: resource, options: opts, disposable });
    return Promise.resolve();
  }

  unwatch(watcher: number): Promise<void> {
    const watcherEntry = this.watchers.get(watcher);
    if (watcherEntry) {
      this.watchers.delete(watcher);
      watcherEntry.disposable();
    }
    return Promise.resolve();
  }
}
