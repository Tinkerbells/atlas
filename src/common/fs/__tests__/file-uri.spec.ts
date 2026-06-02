import { describe, it, expect } from "vitest";
import { FileUri, URI } from "~/common/fs";

describe("FileUri", () => {
  describe("create", () => {
    it("creates a file URI from Unix path", () => {
      const uri = FileUri.create("/home/user/documents");
      expect(uri.scheme).toBe("file");
      expect(uri.path).toBe("/home/user/documents");
    });

    it("creates a file URI from Windows path", () => {
      const uri = FileUri.create("C:\\Users\\test");
      expect(uri.scheme).toBe("file");
    });
  });

  describe("fsPath", () => {
    it("extracts Unix path from URI", () => {
      const uri = URI.fromFilePath("/home/user/foo.txt");
      expect(FileUri.fsPath(uri)).toBe("/home/user/foo.txt");
    });

    it("extracts Windows path from URI", () => {
      const uri = URI.fromFilePath("C:\\Users\\test");
      const path = FileUri.fsPath(uri);
      expect(path).toMatch(/^[cC]:\\Users\\test$/);
    });

    it("accepts a string and parses it", () => {
      const path = FileUri.fsPath("file:///home/user");
      expect(path).toBe("/home/user");
    });
  });
});
