import { describe, expect, it } from "vitest";
import { URI } from "@platform/common/uri/uri";
import { basename, dirname, extUri, extUriIgnorePathCase, isEqual, isEqualOrParent, joinPath, normalizePath } from "@platform/common/uri/resources";

describe("resources / IExtUri", () => {
  describe("isEqual", () => {
    it("returns true for same URIs", () => {
      const a = URI.parse("foo://bar/bang");
      expect(isEqual(a, a)).toBe(true);
    });

    it("returns false for different schemes", () => {
      const a = URI.parse("foo://bar/bang");
      const b = URI.parse("baz://bar/bang");
      expect(isEqual(a, b)).toBe(false);
    });

    it("respects case sensitivity with extUri", () => {
      const a = URI.parse("file:///foo/bar");
      const b = URI.parse("file:///foo/BAR");
      if (process.platform === "linux") {
        expect(extUri.isEqual(a, b)).toBe(false);
      }
      else {
        expect(extUri.isEqual(a, b)).toBe(true);
      }
    });
  });

  describe("isEqualOrParent", () => {
    it("returns true for parent relationship", () => {
      const base = URI.parse("file:///foo/bar");
      const parent = URI.parse("file:///foo");
      expect(isEqualOrParent(base, parent)).toBe(true);
    });

    it("returns true for same URI", () => {
      const base = URI.parse("file:///foo/bar");
      expect(isEqualOrParent(base, base)).toBe(true);
    });

    it("returns false for unrelated paths", () => {
      const base = URI.parse("file:///foo/bar");
      const parent = URI.parse("file:///baz");
      expect(isEqualOrParent(base, parent)).toBe(false);
    });
  });

  describe("dirname", () => {
    it("returns parent directory", () => {
      const uri = URI.parse("file:///foo/bar/baz.txt");
      const dir = dirname(uri);
      expect(dir.path).toBe("/foo/bar");
    });

    it("returns same URI when path is empty", () => {
      const uri = URI.parse("foo:");
      expect(dirname(uri).toString()).toBe(uri.toString());
    });
  });

  describe("basename", () => {
    it("returns file name", () => {
      expect(basename(URI.parse("file:///foo/bar/baz.txt"))).toBe("baz.txt");
      expect(basename(URI.parse("file:///foo/bar/"))).toBe("bar");
    });
  });

  describe("joinPath", () => {
    it("joins fragments", () => {
      const uri = URI.parse("file:///foo");
      expect(joinPath(uri, "bar", "baz.txt").path).toBe("/foo/bar/baz.txt");
    });

    it("normalizes .. and .", () => {
      const uri = URI.parse("file:///foo/bar");
      expect(joinPath(uri, "..", "baz").path).toBe("/foo/baz");
    });
  });

  describe("normalizePath", () => {
    it("resolves . and ..", () => {
      const uri = URI.parse("file:///foo/./bar/../baz");
      const normalized = normalizePath(uri);
      expect(normalized.path).toBe("/foo/baz");
    });

    it("leaves empty path unchanged", () => {
      const uri = URI.parse("foo:");
      expect(normalizePath(uri).toString()).toBe(uri.toString());
    });
  });

  describe("ignorePathCase", () => {
    it("ignores case when configured", () => {
      const a = URI.parse("file:///FOO");
      const b = URI.parse("file:///foo");
      expect(extUriIgnorePathCase.isEqual(a, b)).toBe(true);
    });
  });
});
