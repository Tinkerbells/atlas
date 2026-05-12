import type { CancellationToken } from "@platform/common/cancellation";
import type { IFileSystemCrawler, ScannedEntry, ScanOptions } from "@platform/common/file-system-crawler";

import { statSync } from "node:fs";
import * as paths from "node:path";
import { fdir as FdirBuilder } from "fdir";
import { URI } from "@platform/common/uri/uri";

const LINUX_SPECIAL_DIRS = ["/proc", "/sys", "/dev", "/run", "/tmp"];

export class FdirCrawler implements IFileSystemCrawler {
  declare readonly _serviceBrand: undefined;

  async* scan(drive: URI, options: ScanOptions, token?: CancellationToken): AsyncIterable<ScannedEntry> {
    const revivedDrive = URI.revive(drive);
    const drivePath = revivedDrive.fsPath;
    const driveKey = this._getDriveKey(revivedDrive);

    console.log(`[FdirCrawler] Starting scan of ${drivePath}`);

    const abortController = new AbortController();
    let disposable: { dispose: () => void } | undefined;
    if (typeof token?.onCancellationRequested === "function") {
      disposable = token?.onCancellationRequested(() => abortController.abort());
    }

    try {
      const builder = new FdirBuilder()
        .withBasePath()
        .withDirs()
        .withMaxDepth(options.maxDepth ?? Infinity);

      if (options.excludeHidden) {
        builder.exclude((_, dirPath) => paths.basename(dirPath).startsWith("."));
      }

      const excludePaths = options.excludePaths ?? [];
      if (process.platform !== "win32" && drivePath === "/") {
        for (const dir of LINUX_SPECIAL_DIRS) {
          if (!excludePaths.includes(dir)) {
            excludePaths.push(dir);
          }
        }
      }

      if (excludePaths.length > 0) {
        const excludeSet = new Set(excludePaths.map(p => paths.resolve(p)));
        builder.exclude((_, dirPath) => excludeSet.has(paths.resolve(dirPath)));
      }

      builder.withAbortSignal(abortController.signal);

      const api = builder.crawl(drivePath);
      const results = await api.withPromise();

      console.log(`[FdirCrawler] Found ${results.length} entries in ${drivePath}`);

      let yielded = 0;
      let skipped = 0;

      for (const filePath of results) {
        if (token?.isCancellationRequested) {
          console.log(`[FdirCrawler] Scan cancelled after ${yielded} entries`);
          break;
        }

        try {
          const stats = statSync(filePath);
          const name = paths.basename(filePath);
          const parentPath = paths.dirname(filePath);
          const ext = paths.extname(filePath);
          const stem = name.substring(0, name.length - ext.length);

          const entry: ScannedEntry = {
            uri: URI.file(filePath),
            path: filePath,
            parentPath,
            name,
            stem,
            extension: ext || null,
            size: stats.size,
            modifiedTime: stats.mtimeMs,
            createdTime: stats.birthtimeMs,
            isDirectory: stats.isDirectory(),
            isHidden: name.startsWith("."),
            drive: driveKey,
          };

          yield entry;
          yielded++;
        }
        catch (err) {
          skipped++;
          console.warn(`[FdirCrawler] Failed to stat ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
          continue;
        }
      }

      console.log(`[FdirCrawler] Scan of ${drivePath} complete. Yielded: ${yielded}, skipped: ${skipped}`);
    }
    finally {
      disposable?.dispose();
    }
  }

  private _getDriveKey(drive: URI): string {
    if (process.platform === "win32") {
      const match = drive.fsPath.match(/^([A-Z]:)/i);
      return match ? match[1]!.toUpperCase() : drive.fsPath;
    }
    return "/";
  }
}
