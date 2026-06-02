import { URI } from "./uri";

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

export interface IFileSystemProvider {
  readonly capabilities: FileSystemProviderCapabilities;
  readonly onDidChangeCapabilities?: (cb: () => void) => void;

  stat(resource: URI): Promise<Stat>;
  readdir(resource: URI): Promise<[string, FileType][]>;
  readFile(resource: URI): Promise<Uint8Array>;
  writeFile(resource: URI, content: Uint8Array): Promise<void>;
  delete(resource: URI, options?: { recursive?: boolean; useTrash?: boolean }): Promise<void>;
  rename(from: URI, to: URI, options?: { overwrite?: boolean }): Promise<void>;
  copy?(from: URI, to: URI, options?: { overwrite?: boolean }): Promise<void>;
  watch(resource: URI): () => void;
}
