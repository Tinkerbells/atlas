import type { URI } from "@platform/common/uri/uri";
import type { CancellationToken } from "@platform/common/cancellation";

import { createDecorator } from "@core/di/instantiation";

export interface ScannedEntry {
  uri: URI;
  path: string;
  parentPath: string;
  name: string;
  stem: string;
  extension: string | null;
  size: number;
  modifiedTime: number;
  createdTime: number;
  isDirectory: boolean;
  isHidden: boolean;
  drive: string;
}

export interface ScanOptions {
  maxDepth?: number;
  excludeHidden?: boolean;
  excludePaths?: string[];
}

export interface IFileSystemCrawler {
  readonly _serviceBrand: undefined;
  scan: (drive: URI, options: ScanOptions, token?: CancellationToken) => AsyncIterable<ScannedEntry>;
}

export const IFileSystemCrawler = createDecorator<IFileSystemCrawler>("fileSystemCrawler");
