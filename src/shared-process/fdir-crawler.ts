import type { CancellationToken } from "@platform/common/cancellation";
import type { IFileSystemCrawler, ScannedEntry, ScanOptions } from "@platform/common/file-system-crawler";

import { statSync } from "node:fs";
import * as paths from "node:path";
import { Minimatch } from "minimatch";
import { fdir as FdirBuilder } from "fdir";
import { URI } from "@platform/common/uri/uri";

const LINUX_SPECIAL_DIRS = ["/proc", "/sys", "/dev", "/run", "/tmp", "/var"];

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

      const excludePaths = options.excludePaths ?? [];
      if (process.platform !== "win32" && drivePath === "/") {
        for (const dir of LINUX_SPECIAL_DIRS) {
          if (!excludePaths.includes(dir)) {
            excludePaths.push(dir);
          }
        }
      }

      const excludeGlobs = options.excludeGlobs ?? [];
      const minimatchers = excludeGlobs.map(g => new Minimatch(g, { dot: true }));

      // fdir.exclude() overwrites the previous predicate on each call.
      // Combine everything into a single callback.
      if (options.excludeHidden || excludePaths.length > 0 || minimatchers.length > 0) {
        const excludeSet = new Set(excludePaths.map(p => paths.resolve(p)));
        builder.exclude((dirName, dirPath) => {
          if (options.excludeHidden && dirName.startsWith(".")) {
            return true;
          }
          if (excludeSet.size > 0 && excludeSet.has(paths.resolve(dirPath))) {
            return true;
          }
          if (minimatchers.length > 0) {
            const relativePath = paths.relative(drivePath, dirPath);
            if (minimatchers.some(m => m.match(relativePath) || m.match(dirName))) {
              return true;
            }
          }
          return false;
        });
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

          if (options.excludeHidden && name.startsWith(".")) {
            skipped++;
            continue;
          }

          const parentPath = paths.dirname(filePath);
          const ext = paths.extname(filePath);
          const stem = name.substring(0, name.length - ext.length);

          if (minimatchers.length > 0) {
            const relativePath = paths.relative(drivePath, filePath);
            if (minimatchers.some(m => m.match(relativePath) || m.match(name))) {
              skipped++;
              continue;
            }
          }

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
