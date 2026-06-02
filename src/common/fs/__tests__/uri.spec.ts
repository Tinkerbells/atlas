import { describe, it, expect } from "vitest";
import { URI } from "~/common/fs";

describe("URI", () => {
  describe("parse", () => {
    it("parses a file URI string", () => {
      const uri = URI.parse("file:///home/user/foo.txt");
      expect(uri.scheme).toBe("file");
      expect(uri.path).toBe("/home/user/foo.txt");
    });

    it("parses a URI with authority", () => {
      const uri = URI.parse("https://example.com/path?q=1");
      expect(uri.scheme).toBe("https");
      expect(uri.authority).toBe("example.com");
      expect(uri.path).toBe("/path");
      expect(uri.query).toBe("q=1");
    });
  });

  describe("fromFilePath", () => {
    it("creates a file URI from an absolute Unix path", () => {
      const uri = URI.fromFilePath("/home/user");
      expect(uri.scheme).toBe("file");
      expect(uri.path).toBe("/home/user");
    });

    it("creates a file URI from a Windows path", () => {
      const uri = URI.fromFilePath("C:\\Users\\test");
      expect(uri.scheme).toBe("file");
      expect(uri.fsPath).toMatch(/^[cC]:\\Users\\test$/);
    });
  });

  describe("fromComponents / toComponents", () => {
    it("round-trips through components", () => {
      const original = URI.parse("file:///foo/bar?baz=1#frag");
      const restored = URI.fromComponents(original.toComponents());
      expect(restored.toString()).toBe(original.toString());
    });
  });

  describe("parent", () => {
    it("returns the parent directory", () => {
      const uri = URI.parse("file:///home/user/foo.txt");
      expect(uri.parent.path).toBe("/home/user");
    });

    it("returns itself for root", () => {
      const uri = URI.parse("file:///");
      expect(uri.parent.path).toBe("/");
    });
  });

  describe("resolve", () => {
    it("appends a path segment", () => {
      const uri = URI.parse("file:///home/user");
      const resolved = uri.resolve("foo.txt");
      expect(resolved.path).toBe("/home/user/foo.txt");
    });

    it("handles trailing slash", () => {
      const uri = URI.parse("file:///home/user/");
      const resolved = uri.resolve("foo.txt");
      expect(resolved.path).toBe("/home/user/foo.txt");
    });
  });

  describe("withScheme", () => {
    it("changes the scheme", () => {
      const uri = URI.parse("file:///home/user");
      const changed = uri.withScheme("user-storage");
      expect(changed.scheme).toBe("user-storage");
      expect(changed.path).toBe("/home/user");
    });
  });

  describe("withPath", () => {
    it("changes the path", () => {
      const uri = URI.parse("file:///old");
      const changed = uri.withPath("/new");
      expect(changed.path).toBe("/new");
      expect(changed.scheme).toBe("file");
    });
  });

  describe("isEqual", () => {
    it("returns true for identical URIs", () => {
      const a = URI.parse("file:///home/user");
      const b = URI.parse("file:///home/user");
      expect(a.isEqual(b)).toBe(true);
    });

    it("returns false for different URIs", () => {
      const a = URI.parse("file:///home/user");
      const b = URI.parse("file:///home/other");
      expect(a.isEqual(b)).toBe(false);
    });
  });

  describe("isEqualOrParent", () => {
    it("returns true for exact match", () => {
      const a = URI.parse("file:///home/user");
      const b = URI.parse("file:///home/user");
      expect(a.isEqualOrParent(b)).toBe(true);
    });

    it("returns true for child", () => {
      const parent = URI.parse("file:///home/user");
      const child = URI.parse("file:///home/user/foo.txt");
      expect(parent.isEqualOrParent(child)).toBe(true);
    });

    it("returns false for unrelated", () => {
      const a = URI.parse("file:///home/user");
      const b = URI.parse("file:///other/path");
      expect(a.isEqualOrParent(b)).toBe(false);
    });

    it("returns false for different scheme", () => {
      const a = URI.parse("file:///home/user");
      const b = URI.parse("http:///home/user/foo");
      expect(a.isEqualOrParent(b)).toBe(false);
    });
  });

  describe("toString", () => {
    it("returns the canonical string", () => {
      const uri = URI.parse("file:///home/user/foo.txt");
      expect(uri.toString()).toBe("file:///home/user/foo.txt");
    });
  });
});
