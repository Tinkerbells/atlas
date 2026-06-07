import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";

import { FileUri } from "~/common/fs";
import { DiskFileSystemProvider } from "~/main/fs/disk-fs-provider";
import { FileSystemProviderServer } from "~/main/fs/remote-fs-server";

describe("fileSystemProviderServer", () => {
  let tmpDir: string;
  let provider: DiskFileSystemProvider;
  let server: FileSystemProviderServer;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "atlas-test-"));
    provider = new DiskFileSystemProvider();
    server = new FileSystemProviderServer(provider);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("gets capabilities", async () => {
    const caps = await server.getCapabilities();
    expect(caps).toBe(provider.capabilities);
  });

  it("stats a file", async () => {
    const filePath = join(tmpDir, "test.txt");
    writeFileSync(filePath, "hello");

    const stat = await server.stat(FileUri.create(filePath).toString());
    expect(stat.type & 1).toBe(1); // File = 1
    expect(stat.size).toBe(5);
  });

  it("stats a directory", async () => {
    const dirPath = join(tmpDir, "subdir");
    mkdirSync(dirPath);

    const stat = await server.stat(FileUri.create(dirPath).toString());
    expect(stat.type & 2).toBe(2); // Directory = 2
  });

  it("reads a file", async () => {
    const filePath = join(tmpDir, "test.txt");
    writeFileSync(filePath, "hello world");

    const data = await server.readFile(FileUri.create(filePath).toString());
    expect(new TextDecoder().decode(data)).toBe("hello world");
  });

  it("writes a file", async () => {
    const filePath = join(tmpDir, "new.txt");

    await server.writeFile(
      FileUri.create(filePath).toString(),
      new TextEncoder().encode("test content"),
      { create: true },
    );

    const data = await server.readFile(FileUri.create(filePath).toString());
    expect(new TextDecoder().decode(data)).toBe("test content");
  });

  it("lists directory entries", async () => {
    mkdirSync(join(tmpDir, "a"));
    writeFileSync(join(tmpDir, "b.txt"), "");

    const entries = await server.readdir(FileUri.create(tmpDir).toString());
    const names = entries.map(([name]) => name).sort();
    expect(names).toEqual(["a", "b.txt"]);
  });

  it("opens, reads, and closes file handle", async () => {
    const filePath = join(tmpDir, "handle-test.txt");
    writeFileSync(filePath, "abcd");

    const fd = await server.open(FileUri.create(filePath).toString(), {});
    expect(typeof fd).toBe("number");

    const { bytes, bytesRead } = await server.read(fd, 0, 4);
    expect(bytesRead).toBe(4);
    expect(new TextDecoder().decode(bytes.slice(0, bytesRead))).toBe("abcd");

    await server.close(fd);
  });

  it("creates directory", async () => {
    const dirPath = join(tmpDir, "newdir");
    await server.mkdir(FileUri.create(dirPath).toString());
    expect(() => server.stat(FileUri.create(dirPath).toString())).not.toThrow();
  });

  it("renames a file", async () => {
    const fromPath = join(tmpDir, "from.txt");
    const toPath = join(tmpDir, "to.txt");
    writeFileSync(fromPath, "data");

    await server.rename(
      FileUri.create(fromPath).toString(),
      FileUri.create(toPath).toString(),
      {},
    );

    expect(() => server.stat(FileUri.create(fromPath).toString())).rejects.toThrow();
    const stat = await server.stat(FileUri.create(toPath).toString());
    expect(stat.size).toBe(4);
  });

  it("deletes a file", async () => {
    const filePath = join(tmpDir, "delete-me.txt");
    writeFileSync(filePath, "");

    await server.delete(FileUri.create(filePath).toString(), {});
    expect(() => server.stat(FileUri.create(filePath).toString())).rejects.toThrow();
  });
});
