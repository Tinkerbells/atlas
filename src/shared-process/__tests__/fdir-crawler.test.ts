import * as fs from "node:fs";
import * as path from "node:path";
import { URI } from "@platform/common/uri/uri";
import { FdirCrawler } from "@shared-process/fdir-crawler";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("fdirCrawler", () => {
  let tmpDir: string;
  let crawler: FdirCrawler;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync("/tmp/atlas-crawler-test-");
    crawler = new FdirCrawler();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  async function collectEntries(uri: URI, options: any) {
    const entries: any[] = [];
    for await (const entry of crawler.scan(uri, options)) {
      entries.push(entry);
    }
    return entries;
  }

  it("includes all files without exclusions", async () => {
    fs.writeFileSync(path.join(tmpDir, "a.txt"), "a");
    fs.writeFileSync(path.join(tmpDir, "b.txt"), "b");

    const entries = await collectEntries(URI.file(tmpDir), { excludeHidden: false });
    const names = entries.map(e => e.name);
    expect(names).toContain("a.txt");
    expect(names).toContain("b.txt");
  });

  it("excludes files matching glob patterns", async () => {
    fs.mkdirSync(path.join(tmpDir, "node_modules", "foo"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "node_modules", "foo", "package.json"), "{}");
    fs.mkdirSync(path.join(tmpDir, "src"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "src", "main.ts"), "");
    fs.mkdirSync(path.join(tmpDir, ".git"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".git", "HEAD"), "");
    fs.writeFileSync(path.join(tmpDir, "readme.md"), "");

    const entries = await collectEntries(URI.file(tmpDir), {
      excludeHidden: false,
      excludeGlobs: ["**/node_modules", "**/.git"],
    });
    const names = entries.map(e => e.name);
    expect(names).toContain("main.ts");
    expect(names).toContain("readme.md");
    expect(names).not.toContain("package.json");
    expect(names).not.toContain("HEAD");
  });

  it("excludes hidden files when excludeHidden is true", async () => {
    fs.writeFileSync(path.join(tmpDir, "visible.txt"), "");
    fs.writeFileSync(path.join(tmpDir, ".hidden"), "");

    const entries = await collectEntries(URI.file(tmpDir), { excludeHidden: true });
    const names = entries.map(e => e.name);
    expect(names).toContain("visible.txt");
    expect(names).not.toContain(".hidden");
  });
});
