import { describe, it, expect, beforeEach } from "vitest";
import { FSService, URI, FileType } from "~/common/fs";
import type { IFileSystemProvider, Stat } from "~/common/fs";

class MockProvider implements IFileSystemProvider {
  readonly capabilities = 0;
  private files = new Map<string, { type: FileType; size: number; content?: Uint8Array }>();

  addFile(uri: URI, type: FileType, size = 0, content?: Uint8Array) {
    this.files.set(uri.toString(), { type, size, content });
  }

  async stat(resource: URI): Promise<Stat> {
    const entry = this.files.get(resource.toString());
    if (!entry) throw new Error("ENOENT");
    return {
      type: entry.type,
      ctime: 0,
      mtime: 0,
      size: entry.size,
    };
  }

  async readdir(resource: URI): Promise<[string, FileType][]> {
    const prefix = resource.toString().replace(/\/?$/, "/");
    const children: [string, FileType][] = [];
    for (const [key, value] of this.files) {
      if (key.startsWith(prefix) && key !== resource.toString()) {
        const name = key.slice(prefix.length).split("/")[0];
        if (!children.some(([n]) => n === name)) {
          children.push([name, value.type]);
        }
      }
    }
    return children;
  }

  async readFile(resource: URI): Promise<Uint8Array> {
    const entry = this.files.get(resource.toString());
    if (!entry) throw new Error("ENOENT");
    return entry.content ?? new Uint8Array();
  }

  async writeFile(resource: URI, content: Uint8Array): Promise<void> {
    const existing = this.files.get(resource.toString());
    this.files.set(resource.toString(), {
      type: FileType.File,
      size: content.length,
      content,
    });
  }

  async delete(): Promise<void> {}
  async rename(): Promise<void> {}
  watch(): () => void {
    return () => {};
  }
}

describe("FSService", () => {
  let service: FSService;
  let provider: MockProvider;

  beforeEach(() => {
    service = new FSService();
    provider = new MockProvider();
    service.registerProvider("mock", provider);
  });

  describe("registerProvider", () => {
    it("registers a provider for a scheme", () => {
      const p = new MockProvider();
      const dispose = service.registerProvider("mock2", p);
      expect(typeof dispose).toBe("function");
    });

    it("throws on duplicate scheme", () => {
      expect(() => service.registerProvider("mock", new MockProvider())).toThrow("already registered");
    });
  });

  describe("getProvider", () => {
    it("returns undefined for unregistered scheme", () => {
      expect(service.getProvider("unknown")).toBeUndefined();
    });
  });

  describe("stat", () => {
    it("returns file stat", async () => {
      const uri = URI.parse("mock:///foo.txt");
      provider.addFile(uri, FileType.File, 42);
      const stat = await service.stat(uri);
      expect(stat.isFile).toBe(true);
      expect(stat.isDirectory).toBe(false);
      expect(stat.size).toBe(42);
      expect(stat.name).toBe("foo.txt");
    });

    it("returns directory stat", async () => {
      const uri = URI.parse("mock:///mydir");
      provider.addFile(uri, FileType.Directory);
      const stat = await service.stat(uri);
      expect(stat.isDirectory).toBe(true);
      expect(stat.name).toBe("mydir");
    });
  });

  describe("resolve", () => {
    it("resolves without children by default", async () => {
      const uri = URI.parse("mock:///dir");
      provider.addFile(uri, FileType.Directory);
      const stat = await service.resolve(uri);
      expect(stat.children).toBeUndefined();
    });

    it("resolves children when requested", async () => {
      const dirUri = URI.parse("mock:///dir");
      const childUri = URI.parse("mock:///dir/child.txt");
      provider.addFile(dirUri, FileType.Directory);
      provider.addFile(childUri, FileType.File, 10);
      const stat = await service.resolve(dirUri, { resolveChildren: true });
      expect(stat.children).toHaveLength(1);
      expect(stat.children![0].name).toBe("child.txt");
    });
  });

  describe("error handling", () => {
    it("throws for unregistered scheme", async () => {
      const uri = URI.parse("unknown:///file.txt");
      await expect(service.stat(uri)).rejects.toThrow("No FileSystemProvider");
    });
  });
});
