import { DatabaseService } from "@shared-process/database-service";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileSearchService } from "@shared-process/file-search-service";
import { initialSchemaMigration } from "@shared-process/migrations/001-initial-schema";

describe("fileSearchService", () => {
  let db: DatabaseService;
  let service: FileSearchService;

  beforeEach(() => {
    db = new DatabaseService(":memory:");
    db.registerMigrations([initialSchemaMigration]);
    db.migrate();
    service = new FileSearchService(db);

    // Seed test data
    const insert = db.prepare<
      [string, string, string, string, string, string, string | null, number, number, number, number, number, string, number],
      unknown
    >(`
      INSERT INTO files (uri, scheme, path, parent_path, name, stem, extension, size, modified_time, created_time, is_directory, is_hidden, drive, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    const files = [
      ["file:///home/user/documents/report.pdf", "file", "/home/user/documents/report.pdf", "/home/user/documents", "report.pdf", "report", ".pdf", 1024, now, now, 0, 0, "/", now],
      ["file:///home/user/documents/notes.txt", "file", "/home/user/documents/notes.txt", "/home/user/documents", "notes.txt", "notes", ".txt", 512, now, now, 0, 0, "/", now],
      ["file:///home/user/projects/atlas/main.ts", "file", "/home/user/projects/atlas/main.ts", "/home/user/projects/atlas", "main.ts", "main", ".ts", 2048, now, now, 0, 0, "/", now],
      ["file:///home/user/projects/atlas/README.md", "file", "/home/user/projects/atlas/README.md", "/home/user/projects/atlas", "README.md", "README", ".md", 4096, now, now, 0, 0, "/", now],
      ["file:///home/user/music/song.mp3", "file", "/home/user/music/song.mp3", "/home/user/music", "song.mp3", "song", ".mp3", 10240, now, now, 0, 0, "/", now],
      ["file:///home/user/projects", "file", "/home/user/projects", "/home/user", "projects", "projects", null, 0, now, now, 1, 0, "/", now],
    ] as const;

    db.transaction(() => {
      for (const f of files) {
        (insert.run as (...args: any[]) => any)(...f);
      }
    });
  });

  afterEach(() => {
    db.dispose();
  });

  describe("search", () => {
    it("returns empty array for empty query", async () => {
      const results = await service.search("");
      expect(results).toEqual([]);
    });

    it("finds files by exact name prefix", async () => {
      const results = await service.search("report");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name === "report.pdf")).toBe(true);
    });

    it("finds files by name prefix (case-insensitive)", async () => {
      const results = await service.search("REPORT");
      expect(results.some(r => r.name === "report.pdf")).toBe(true);
    });

    it("finds files inside path segments", async () => {
      const results = await service.search("atlas");
      expect(results.some(r => r.name === "main.ts")).toBe(true);
      expect(results.some(r => r.name === "README.md")).toBe(true);
    });

    it("filters by drive", async () => {
      const results = await service.search("report", { drive: "/" });
      expect(results.some(r => r.name === "report.pdf")).toBe(true);

      const noResults = await service.search("report", { drive: "Z:" });
      expect(noResults).toHaveLength(0);
    });

    it("excludes hidden files by default", async () => {
      // Add a hidden file
      const now = Date.now();
      const insert = db.prepare<
        [string, string, string, string, string, string, string | null, number, number, number, number, number, string, number],
        unknown
      >(`INSERT INTO files (uri, scheme, path, parent_path, name, stem, extension, size, modified_time, created_time, is_directory, is_hidden, drive, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      insert.run("file:///home/user/.hidden", "file", "/home/user/.hidden", "/home/user", ".hidden", ".hidden", null, 0, now, now, 0, 1, "/", now);

      const results = await service.search("hidden");
      expect(results.some(r => r.name === ".hidden")).toBe(false);

      const withHidden = await service.search("hidden", { includeHidden: true });
      expect(withHidden.some(r => r.name === ".hidden")).toBe(true);
    });

    it("limits results", async () => {
      const results = await service.search("file", { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("boosts directories in scoring", async () => {
      const results = await service.search("projects");
      const dirIndex = results.findIndex(r => r.isDirectory);
      const fileIndex = results.findIndex(r => !r.isDirectory);

      if (dirIndex !== -1 && fileIndex !== -1) {
        expect(dirIndex).toBeLessThanOrEqual(fileIndex);
      }
    });

    it("returns scores", async () => {
      const results = await service.search("report");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.score).toBeDefined();
      expect(results[0]!.score).toBeGreaterThanOrEqual(0);
      expect(results[0]!.score).toBeLessThanOrEqual(1);
    });

    it("handles multi-word queries", async () => {
      const results = await service.search("atlas main");
      expect(results.some(r => r.name === "main.ts")).toBe(true);
    });

    it("ranks exact matches higher", async () => {
      const results = await service.search("song");
      expect(results[0]!.name).toBe("song.mp3");
    });
  });
});
