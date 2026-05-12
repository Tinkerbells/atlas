import type { CancellationToken } from "@platform/common/cancellation";
import type { IFileSystemCrawler, ScannedEntry, ScanOptions } from "@platform/common/file-system-crawler";

import { URI } from "@platform/common/uri/uri";
import { DatabaseService } from "@shared-process/database-service";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileIndexService } from "@shared-process/file-index-service";
import { CancellationTokenSource } from "@platform/common/cancellation";
import { initialSchemaMigration } from "@shared-process/migrations/001-initial-schema";

class MockCrawler implements IFileSystemCrawler {
  declare readonly _serviceBrand: undefined;
  private entries: ScannedEntry[] = [];

  setEntries(entries: ScannedEntry[]) {
    this.entries = entries;
  }

  async* scan(_drive: URI, _options: ScanOptions, token?: CancellationToken): AsyncIterable<ScannedEntry> {
    for (const entry of this.entries) {
      if (token?.isCancellationRequested) {
        break;
      }
      yield entry;
    }
  }
}

function makeEntry(path: string, opts?: Partial<ScannedEntry>): ScannedEntry {
  const name = path.split("/").pop()!;
  const ext = name.includes(".") ? name.substring(name.lastIndexOf(".")) : "";
  const stem = name.substring(0, name.length - ext.length);
  return {
    uri: URI.file(path),
    path,
    parentPath: path.substring(0, path.length - name.length - 1) || "/",
    name,
    stem,
    extension: ext || null,
    size: 100,
    modifiedTime: Date.now(),
    createdTime: Date.now(),
    isDirectory: false,
    isHidden: name.startsWith("."),
    drive: "/",
    ...opts,
  };
}

describe("fileIndexService", () => {
  let db: DatabaseService;
  let crawler: MockCrawler;
  let service: FileIndexService;

  beforeEach(() => {
    db = new DatabaseService(":memory:");
    db.registerMigrations([initialSchemaMigration]);
    db.migrate();
    crawler = new MockCrawler();
    service = new FileIndexService(db, crawler);
  });

  afterEach(() => {
    db.dispose();
  });

  describe("scanDrives", () => {
    it("inserts new files into index", async () => {
      crawler.setEntries([
        makeEntry("/home/user/documents/file1.txt"),
        makeEntry("/home/user/documents/file2.md"),
      ]);

      const tokenSource = new CancellationTokenSource();
      const results = await service.scanDrives([URI.file("/")], tokenSource.token);

      expect(results).toHaveLength(1);
      expect(results[0]!.inserted).toBe(2);
      expect(results[0]!.updated).toBe(0);
      expect(results[0]!.deleted).toBe(0);

      const countStmt = db.prepare<[], { count: number }>("SELECT COUNT(*) as count FROM files");
      expect(countStmt.get()!.count).toBe(2);
    });

    it("updates changed files", async () => {
      const entry = makeEntry("/home/user/file.txt", { size: 100, modifiedTime: 1000 });
      crawler.setEntries([entry]);

      const tokenSource = new CancellationTokenSource();
      await service.scanDrives([URI.file("/")], tokenSource.token);

      // Modify file
      crawler.setEntries([makeEntry("/home/user/file.txt", { size: 200, modifiedTime: 2000 })]);
      const results = await service.scanDrives([URI.file("/")], tokenSource.token);

      expect(results[0]!.updated).toBe(1);
      expect(results[0]!.inserted).toBe(0);
    });

    it("deletes removed files", async () => {
      crawler.setEntries([
        makeEntry("/home/user/file1.txt"),
        makeEntry("/home/user/file2.txt"),
      ]);

      const tokenSource = new CancellationTokenSource();
      await service.scanDrives([URI.file("/")], tokenSource.token);

      crawler.setEntries([makeEntry("/home/user/file1.txt")]);
      const results = await service.scanDrives([URI.file("/")], tokenSource.token);

      expect(results[0]!.deleted).toBe(1);

      const countStmt = db.prepare<[], { count: number }>("SELECT COUNT(*) as count FROM files");
      expect(countStmt.get()!.count).toBe(1);
    });

    it("respects cancellation token", async () => {
      const entries: ScannedEntry[] = [];
      for (let i = 0; i < 100; i++) {
        entries.push(makeEntry(`/home/user/file${i}.txt`));
      }
      crawler.setEntries(entries);

      const tokenSource = new CancellationTokenSource();
      // Start scan then cancel immediately (simulating race)
      const promise = service.scanDrives([URI.file("/")], tokenSource.token);
      tokenSource.cancel();

      const results = await promise;
      // Should have some results but not all 100
      expect(results[0]!.inserted).toBeLessThan(100);
    });
  });

  describe("getStats", () => {
    it("returns file and drive counts", async () => {
      crawler.setEntries([
        makeEntry("/home/user/file1.txt", { drive: "C:" }),
        makeEntry("/home/user/file2.txt", { drive: "C:" }),
        makeEntry("/other/file3.txt", { drive: "D:" }),
      ]);

      const tokenSource = new CancellationTokenSource();
      await service.scanDrives([URI.file("/")], tokenSource.token);

      const stats = await service.getStats();
      expect(stats.totalFiles).toBe(3);
      expect(stats.totalDrives).toBe(2);
    });
  });

  describe("clearIndex", () => {
    it("removes all files", async () => {
      crawler.setEntries([makeEntry("/home/user/file.txt")]);

      const tokenSource = new CancellationTokenSource();
      await service.scanDrives([URI.file("/")], tokenSource.token);

      await service.clearIndex();

      const countStmt = db.prepare<[], { count: number }>("SELECT COUNT(*) as count FROM files");
      expect(countStmt.get()!.count).toBe(0);
    });
  });
});
