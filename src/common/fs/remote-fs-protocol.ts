import type { CancellationToken } from "../cancellation";
import type { FileDeleteOptions, FileOpenOptions, FileOverwriteOptions, FileSystemProviderCapabilities, FileType, FileWriteOptions, Stat, WatchOptions } from "./fs-provider";

export interface RemoteFileSystemServer {
  getCapabilities: () => Promise<FileSystemProviderCapabilities>;
  stat: (resource: string) => Promise<Stat>;
  access: (resource: string, mode?: number) => Promise<void>;
  fsPath: (resource: string) => Promise<string>;
  open: (resource: string, opts: FileOpenOptions) => Promise<number>;
  close: (fd: number) => Promise<void>;
  read: (fd: number, pos: number, length: number) => Promise<{ bytes: Uint8Array; bytesRead: number }>;
  readFile: (resource: string) => Promise<Uint8Array>;
  readFileStream: (resource: string, handle: number, opts: FileReadStreamOptions, token: CancellationToken) => Promise<void>;
  write: (fd: number, pos: number, data: Uint8Array, offset: number, length: number) => Promise<number>;
  writeFile: (resource: string, content: Uint8Array, opts: FileWriteOptions) => Promise<void>;
  delete: (resource: string, opts: FileDeleteOptions) => Promise<void>;
  mkdir: (resource: string) => Promise<void>;
  readdir: (resource: string) => Promise<[string, FileType][]>;
  rename: (source: string, target: string, opts: FileOverwriteOptions) => Promise<void>;
  copy: (source: string, target: string, opts: FileOverwriteOptions, handle: number) => Promise<void>;
  statfs: (resource: string) => Promise<{ free: number; total: number }>;
  watch: (watcher: number, resource: string, opts: WatchOptions) => Promise<void>;
  unwatch: (watcher: number) => Promise<void>;
}

export interface RemoteFileChange {
  readonly type: number; // FileChangeType
  readonly resource: string;
}

export interface RemoteFileStreamError extends Error {
  code?: number;
}

export interface RemoteFileSystemClient {
  notifyDidChangeFile: (event: { changes: RemoteFileChange[] }) => void;
  notifyFileWatchError: () => void;
  notifyDidChangeCapabilities: (capabilities: FileSystemProviderCapabilities) => void;
  onFileStreamData: (handle: number, data: Uint8Array) => void;
  onFileStreamEnd: (handle: number, error: RemoteFileStreamError | undefined) => void;
  onProgress: (handle: number, current: number, total: number) => void;
}

export interface FileReadStreamOptions {
  readonly position?: number;
  readonly length?: number;
  readonly bufferSize?: number;
}
