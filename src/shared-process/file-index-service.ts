import type { CancellationToken } from "@platform/common/cancellation";
import type { ScannedEntry } from "@platform/common/file-system-crawler";
import type { IFileIndexService, ScanProgress, ScanResult } from "@platform/common/file-index";

import { Emitter } from "@core/base/event";
import { URI } from "@platform/common/uri/uri";
import { IDatabaseService } from "@platform/common/database";
import { CancellationTokenSource } from "@platform/common/cancellation";
import { IFileSystemCrawler } from "@platform/common/file-system-crawler";

export class FileIndexService implements IFileIndexService {
  declare readonly _serviceBrand: undefined;

  private readonly _onDidProgress = new Emitter<ScanProgress>();
  readonly onDidProgress = this._onDidProgress.event;
  private _cancelSource: CancellationTokenSource | null = null;

  constructor(
    @IDatabaseService private databaseService: IDatabaseService,
    @IFileSystemCrawler private crawler: IFileSystemCrawler,
  ) {}

  cancelCurrentScan(): void {
    if (this._cancelSource) {
      console.log("[FileIndexService] Cancelling current scan");
      this._cancelSource.cancel();
    }
  }

  async scanDrives(uris: URI[]): Promise<ScanResult[]> {
    console.log(`[FileIndexService] Starting scan of ${uris.length} drive(s)`);
    this._cancelSource = new CancellationTokenSource();
    const token = this._cancelSource.token;
    const results: ScanResult[] = [];
    for (const uri of uris) {
      if (token.isCancellationRequested) {
        console.log("[FileIndexService] Scan cancelled before next drive");
        break;
      }
      const result = await this._scanDrive(URI.revive(uri), token);
      results.push(result);
    }
    this._cancelSource = null;
    const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
    const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
    const totalDeleted = results.reduce((s, r) => s + r.deleted, 0);
    console.log(`[FileIndexService] Scan complete. Drives: ${results.length}, inserted: ${totalInserted}, updated: ${totalUpdated}, deleted: ${totalDeleted}`);
    return results;
  }

  private async _scanDrive(driveUri: URI, token: CancellationToken): Promise<ScanResult> {
    const startTime = Date.now();
    const driveKey = this._getDriveKey(driveUri);

    console.log(`[FileIndexService] Scanning drive: ${driveKey}`);

    // Get estimated total from previous scan
    const metaStmt = this.databaseService.prepare<[string], { file_count: number }>(
      "SELECT file_count FROM scan_metadata WHERE drive = ?",
    );
    const meta = metaStmt.get(driveKey);
    const estimatedTotal = meta?.file_count;

    const existingStmt = this.databaseService.prepare<[string], { uri: string; modified_time: number; size: number }>(
      "SELECT uri, modified_time, size FROM files WHERE drive = ?",
    );
    const existing = new Map<string, { mtime: number; size: number }>();
    for (const row of existingStmt.all(driveKey)) {
      existing.set(row.uri, { mtime: row.modified_time, size: row.size });
    }

    console.log(`[FileIndexService] ${driveKey}: ${existing.size} existing entries, estimated total: ${estimatedTotal ?? "unknown"}`);

    const upsertStmt = this.databaseService.prepare<
      [string, string, string, string, string, string, string | null, number, number, number, number, number, string, number],
      unknown
    >(`
      INSERT OR REPLACE INTO files (uri, scheme, path, parent_path, name, stem, extension, size, modified_time, created_time, is_directory, is_hidden, drive, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const deleteStmt = this.databaseService.prepare<[string], unknown>("DELETE FROM files WHERE uri = ?");

    const now = Date.now();
    let inserted = 0;
    let updated = 0;
    const batchSize = 100;
    let batch: ScannedEntry[] = [];

    const flushBatch = (entries: ScannedEntry[]) => {
      for (const entry of entries) {
        upsertStmt.run(
          entry.uri.toString(),
          entry.uri.scheme,
          entry.path,
          entry.parentPath,
          entry.name,
          entry.stem,
          entry.extension,
          entry.size,
          entry.modifiedTime,
          entry.createdTime,
          entry.isDirectory ? 1 : 0,
          entry.isHidden ? 1 : 0,
          entry.drive,
          now,
        );
      }
    };

    for await (const entry of this.crawler.scan(driveUri, { excludeHidden: true }, token)) {
      if (token?.isCancellationRequested) {
        console.log(`[FileIndexService] ${driveKey}: cancelled after ${inserted + updated} entries`);
        break;
      }

      const existingEntry = existing.get(entry.uri.toString());

      if (!existingEntry) {
        batch.push(entry);
        inserted++;
      }
      else if (existingEntry.mtime !== entry.modifiedTime || existingEntry.size !== entry.size) {
        batch.push(entry);
        updated++;
        existing.delete(entry.uri.toString());
      }
      else {
        existing.delete(entry.uri.toString());
      }

      if (batch.length >= batchSize) {
        flushBatch(batch);
        batch = [];
        this._onDidProgress.fire({ drive: driveKey, scanned: inserted + updated, total: estimatedTotal });
        console.log(`[FileIndexService] ${driveKey}: progress ${inserted + updated} files`);
      }
    }

    if (batch.length > 0) {
      flushBatch(batch);
      this._onDidProgress.fire({ drive: driveKey, scanned: inserted + updated, total: estimatedTotal });
      console.log(`[FileIndexService] ${driveKey}: final flush of ${batch.length} entries`);
    }

    // Delete dead entries
    const deadUris = [...existing.keys()];
    if (deadUris.length > 0) {
      this.databaseService.transaction(() => {
        for (const uri of deadUris) {
          deleteStmt.run(uri);
        }
      });
      console.log(`[FileIndexService] ${driveKey}: deleted ${deadUris.length} dead entries`);
    }

    // Update scan metadata
    const updateMetaStmt = this.databaseService.prepare<[string, number, number, number], unknown>(
      "INSERT OR REPLACE INTO scan_metadata (drive, last_scan_time, file_count, scan_duration_ms) VALUES (?, ?, ?, ?)",
    );
    const duration = Date.now() - startTime;
    updateMetaStmt.run(driveKey, now, inserted + updated + deadUris.length, duration);

    console.log(`[FileIndexService] ${driveKey}: done in ${duration}ms. inserted=${inserted}, updated=${updated}, deleted=${deadUris.length}`);

    return {
      drive: driveKey,
      inserted,
      updated,
      deleted: deadUris.length,
      duration,
    };
  }

  async getStats(): Promise<{ totalFiles: number; totalDrives: number }> {
    const countStmt = this.databaseService.prepare<[], { count: number }>("SELECT COUNT(*) as count FROM files");
    const driveStmt = this.databaseService.prepare<[], { count: number }>("SELECT COUNT(DISTINCT drive) as count FROM files");
    const totalFiles = countStmt.get()!.count;
    const totalDrives = driveStmt.get()!.count;
    return { totalFiles, totalDrives };
  }

  async clearIndex(): Promise<void> {
    this.databaseService.exec("DELETE FROM files; DELETE FROM files_fts; DELETE FROM scan_metadata;");
  }

  private _getDriveKey(drive: URI): string {
    if (process.platform === "win32") {
      const match = drive.fsPath.match(/^([A-Z]:)/i);
      return match ? match[1]!.toUpperCase() : drive.fsPath;
    }
    return "/";
  }
}
