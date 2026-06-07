import type { URI } from "./uri";

export const enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64,
}

export const enum FileSystemProviderCapabilities {
  ReadWrite = 1 << 0,
  FileOpenReadWriteClose = 1 << 1,
  FileReadStream = 1 << 2,
  FileFolderCopy = 1 << 3,
  PathCaseSensitive = 1 << 4,
  Readonly = 1 << 5,
  Access = 1 << 6,
  Update = 1 << 7,
}

export interface Stat {
  type: FileType;
  ctime: number;
  mtime: number;
  size: number;
}

export interface FileStat extends Stat {
  readonly resource: URI;
  readonly name: string;
  readonly isDirectory: boolean;
  readonly isFile: boolean;
  readonly isSymbolicLink: boolean;
  readonly children?: readonly FileStat[];
}

export interface FileOpenOptions {
  create?: boolean;
}

export interface FileWriteOptions {
  create?: boolean;
  overwrite?: boolean;
}

export interface FileOverwriteOptions {
  overwrite?: boolean;
}

export interface FileDeleteOptions {
  recursive?: boolean;
  useTrash?: boolean;
}

export interface WatchOptions {
  recursive?: boolean;
}

export interface IFileSystemProvider {
  readonly capabilities: FileSystemProviderCapabilities;
  readonly onDidChangeCapabilities?: (cb: () => void) => void;

  stat: (resource: URI) => Promise<Stat>;
  readdir: (resource: URI) => Promise<[string, FileType][]>;
  readFile: (resource: URI) => Promise<Uint8Array>;
  writeFile: (resource: URI, content: Uint8Array, opts?: FileWriteOptions) => Promise<void>;
  delete: (resource: URI, options?: FileDeleteOptions) => Promise<void>;
  rename: (from: URI, to: URI, options?: FileOverwriteOptions) => Promise<void>;
  copy?: (from: URI, to: URI, options?: FileOverwriteOptions) => Promise<void>;
  mkdir: (resource: URI) => Promise<void>;
  open?: (resource: URI, opts?: FileOpenOptions) => Promise<number>;
  close?: (fd: number) => Promise<void>;
  read?: (fd: number, pos: number, data: Uint8Array, offset: number, length: number) => Promise<number>;
  write?: (fd: number, pos: number, data: Uint8Array, offset: number, length: number) => Promise<number>;
  statfs?: (resource: URI) => Promise<{ free: number; total: number }>;
  watch: (resource: URI) => () => void;
}
