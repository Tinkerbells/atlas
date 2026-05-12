import type { Event } from "@core/base/event";
import type { URI } from "@platform/common/uri/uri";

import { createDecorator } from "@core/di/instantiation";

export interface ScanProgress {
  drive: string;
  scanned: number;
  total?: number;
}

export interface ScanResult {
  drive: string;
  inserted: number;
  updated: number;
  deleted: number;
  duration: number;
}

export interface IFileIndexService {
  readonly _serviceBrand: undefined;
  readonly onDidProgress: Event<ScanProgress>;
  scanDrives: (uris: URI[]) => Promise<ScanResult[]>;
  cancelCurrentScan: () => void;
  getStats: () => Promise<{ totalFiles: number; totalDrives: number }>;
  clearIndex: () => Promise<void>;
}

export const IFileIndexService = createDecorator<IFileIndexService>("fileIndexService");
