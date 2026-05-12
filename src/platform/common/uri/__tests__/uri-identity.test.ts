import { describe, expect, it } from "vitest";
import { URI } from "@platform/common/uri/uri";
import { UriIdentityService } from "@platform/common/uri/uri-identity";

describe("uriIdentityService", () => {
  const service = new UriIdentityService();

  describe("asCanonicalUri", () => {
    it("normalizes path", () => {
      const a = URI.parse("file:///foo/bar");
      const canonical = service.asCanonicalUri(a);
      expect(canonical.path).toBe("/foo/bar");
    });

    it("resolves . and ..", () => {
      const a = URI.parse("file:///foo/./bar/../baz");
      const canonical = service.asCanonicalUri(a);
      expect(canonical.path).toBe("/foo/baz");
    });

    it("keeps fragment", () => {
      const a = URI.parse("file:///foo/bar#frag");
      const canonical = service.asCanonicalUri(a);
      expect(canonical.path).toBe("/foo/bar");
      expect(canonical.fragment).toBe("frag");
    });
  });

  describe("extUri.isEqual", () => {
    it("compares case-insensitively on non-linux", () => {
      const a = URI.parse("file:///foo/BAR");
      const b = URI.parse("file:///foo/bar");
      if (process.platform === "linux") {
        expect(service.extUri.isEqual(a, b)).toBe(false);
      }
      else {
        expect(service.extUri.isEqual(a, b)).toBe(true);
      }
    });
  });
});
