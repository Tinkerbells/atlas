import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { DiskFileSystemProvider } from "~/main/fs";
import { FileUri, URI } from "~/common/fs";
import { FileType } from "~/common/fs";

describe("DiskFileSystemProvider", () => {
  let provider: DiskFileSystemProvider;
  let tmpDir: string;

  beforeEach(() => {
    provider = new DiskFileSystemProvider();
    tmpDir = mkdtempSync(join(tmpdir(), "atlas-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function uri(relPath: string): URI {
    return FileUri.create(join(tmpDir, relPath));
  }

  describe("stat", () => {
    it("stats a file", async () => {
      writeFileSync(join(tmpDir, "foo.txt"), "hello");
      const stat = await provider.stat(uri("foo.txt"));
      expect(stat.type & FileType.File).toBe(FileType.File);
      expect(stat.size).toBe(5);
      expect(stat.mtime).toBeGreaterThan(0);
    });

    it("stats a directory", async () => {
      mkdirSync(join(tmpDir, "subdir"));
      const stat = await provider.stat(uri("subdir"));
      expect(stat.type & FileType.Directory).toBe(FileType.Directory);
    });
  });

  describe("readdir", () => {
    it("lists entries", async () => {
      writeFileSync(join(tmpDir, "a.txt"), "a");
      mkdirSync(join(tmpDir, "b"));
      const entries = await provider.readdir(uri(""));
      const names = entries.map(([name]) => name).sort();
      expect(names).toEqual(["a.txt", "b"]);
    });
  });

  describe("readFile", () => {
    it("reads file content", async () => {
      writeFileSync(join(tmpDir, "data.bin"), Buffer.from([1, 2, 3]));
      const content = await provider.readFile(uri("data.bin"));
      expect(content).toEqual(new Uint8Array([1, 2, 3]));
    });
  });

  describe("writeFile", () => {
    it("writes file and creates parent dirs", async () => {
      await provider.writeFile(uri("nested/dir/file.txt"), new TextEncoder().encode("content"));
      const content = readFileSync(join(tmpDir, "nested/dir/file.txt"), "utf-8");
      expect(content).toBe("content");
    });
  });

  describe("delete", () => {
    it("deletes a file", async () => {
      writeFileSync(join(tmpDir, "del.txt"), "x");
      await provider.delete(uri("del.txt"));
      expect(() => readFileSync(join(tmpDir, "del.txt"))).toThrow();
    });

    it("deletes a directory recursively", async () => {
      mkdirSync(join(tmpDir, "deldir"));
      writeFileSync(join(tmpDir, "deldir", "inner.txt"), "x");
      await provider.delete(uri("deldir"), { recursive: true });
      expect(() => readFileSync(join(tmpDir, "deldir"))).toThrow();
    });
  });

  describe("rename", () => {
    it("renames a file", async () => {
      writeFileSync(join(tmpDir, "old.txt"), "data");
      await provider.rename(uri("old.txt"), uri("new.txt"));
      expect(readFileSync(join(tmpDir, "new.txt"), "utf-8")).toBe("data");
      expect(() => readFileSync(join(tmpDir, "old.txt"))).toThrow();
    });
  });

  describe("copy", () => {
    it("copies a file", async () => {
      writeFileSync(join(tmpDir, "src.txt"), "copy me");
      await provider.copy(uri("src.txt"), uri("dst.txt"));
      expect(readFileSync(join(tmpDir, "dst.txt"), "utf-8")).toBe("copy me");
    });

    it("throws on overwrite=false when target exists", async () => {
      writeFileSync(join(tmpDir, "src.txt"), "a");
      writeFileSync(join(tmpDir, "dst.txt"), "b");
      await expect(provider.copy(uri("src.txt"), uri("dst.txt"))).rejects.toThrow();
    });
  });

  describe("watch", () => {
    it("returns a dispose function", () => {
      writeFileSync(join(tmpDir, "watch.txt"), "");
      const dispose = provider.watch(uri("watch.txt"));
      expect(typeof dispose).toBe("function");
      dispose();
    });
  });
});
