import { describe, expect, it } from "vitest";
import { isUriComponents, URI } from "@platform/common/uri/uri";

const isWindows = process.platform === "win32";

describe("uRI", () => {
  describe("file#toString", () => {
    it("encodes windows drive letters", () => {
      expect(URI.file("c:/win/path").toString()).toBe("file:///c%3A/win/path");
      expect(URI.file("C:/win/path").toString()).toBe("file:///c%3A/win/path");
      expect(URI.file("c:/win/path/").toString()).toBe("file:///c%3A/win/path/");
      expect(URI.file("/c:/win/path").toString()).toBe("file:///c%3A/win/path");
    });
  });

  describe("uRI.file (win-special)", () => {
    it("handles windows backslash paths", () => {
      if (isWindows) {
        expect(URI.file("c:\\win\\path").toString()).toBe("file:///c%3A/win/path");
        expect(URI.file("c:\\win/path").toString()).toBe("file:///c%3A/win/path");
      }
      else {
        expect(URI.file("c:\\win\\path").toString()).toBe("file:///c%3A%5Cwin%5Cpath");
        expect(URI.file("c:\\win/path").toString()).toBe("file:///c%3A%5Cwin/path");
      }
    });
  });

  describe("file#fsPath (win-special)", () => {
    it("converts to platform path", () => {
      if (isWindows) {
        expect(URI.file("c:\\win\\path").fsPath).toBe("c:\\win\\path");
        expect(URI.file("c:\\win/path").fsPath).toBe("c:\\win\\path");
        expect(URI.file("c:/win/path").fsPath).toBe("c:\\win\\path");
        expect(URI.file("c:/win/path/").fsPath).toBe("c:\\win\\path\\");
        expect(URI.file("C:/win/path").fsPath).toBe("c:\\win\\path");
        expect(URI.file("/c:/win/path").fsPath).toBe("c:\\win\\path");
        expect(URI.file("./c/win/path").fsPath).toBe("\\.\\c\\win\\path");
      }
      else {
        expect(URI.file("c:/win/path").fsPath).toBe("c:/win/path");
        expect(URI.file("c:/win/path/").fsPath).toBe("c:/win/path/");
        expect(URI.file("C:/win/path").fsPath).toBe("c:/win/path");
        expect(URI.file("/c:/win/path").fsPath).toBe("c:/win/path");
        expect(URI.file("./c/win/path").fsPath).toBe("/./c/win/path");
      }
    });
  });

  describe("uRI#fsPath - no path", () => {
    it("returns root when path is empty", () => {
      const value = URI.parse("file://%2Fhome%2Fticino%2Fdesktop%2Fcpluscplus%2Ftest.cpp");
      expect(value.authority).toBe("/home/ticino/desktop/cpluscplus/test.cpp");
      expect(value.path).toBe("/");
      if (isWindows) {
        expect(value.fsPath).toBe("\\");
      }
      else {
        expect(value.fsPath).toBe("/");
      }
    });
  });

  describe("http#toString", () => {
    it("serializes http URIs", () => {
      expect(URI.from({ scheme: "http", authority: "www.example.com", path: "/my/path" }).toString()).toBe("http://www.example.com/my/path");
      expect(URI.from({ scheme: "http", authority: "www.EXAMPLE.com", path: "/my/path" }).toString()).toBe("http://www.example.com/my/path");
      expect(URI.from({ scheme: "http", authority: "", path: "my/path" }).toString()).toBe("http:/my/path");
      expect(URI.from({ scheme: "http", authority: "", path: "/my/path" }).toString()).toBe("http:/my/path");
      expect(URI.from({ scheme: "http", authority: "example.com", path: "/", query: "test=true" }).toString()).toBe("http://example.com/?test%3Dtrue");
      expect(URI.from({ scheme: "http", authority: "example.com", path: "/", query: "", fragment: "test=true" }).toString()).toBe("http://example.com/#test%3Dtrue");
    });
  });

  describe("http#toString, encode=FALSE", () => {
    it("skips encoding when requested", () => {
      expect(URI.from({ scheme: "http", authority: "example.com", path: "/", query: "test=true" }).toString(true)).toBe("http://example.com/?test=true");
      expect(URI.from({ scheme: "http", authority: "example.com", path: "/", query: "", fragment: "test=true" }).toString(true)).toBe("http://example.com/#test=true");
      expect(URI.from({ scheme: "http", path: "/api/files/test.me", query: "t=1234" }).toString(true)).toBe("http:/api/files/test.me?t=1234");

      const value = URI.parse("file://shares/pröjects/c%23/#l12");
      expect(value.authority).toBe("shares");
      expect(value.path).toBe("/pröjects/c#/");
      expect(value.fragment).toBe("l12");
      expect(value.toString()).toBe("file://shares/pr%C3%B6jects/c%23/#l12");
      expect(value.toString(true)).toBe("file://shares/pröjects/c%23/#l12");

      const uri2 = URI.parse(value.toString(true));
      const uri3 = URI.parse(value.toString());
      expect(uri2.authority).toBe(uri3.authority);
      expect(uri2.path).toBe(uri3.path);
      expect(uri2.query).toBe(uri3.query);
      expect(uri2.fragment).toBe(uri3.fragment);
    });
  });

  describe("with, identity", () => {
    it("returns same instance when nothing changes", () => {
      const uri = URI.parse("foo:bar/path");

      let uri2 = uri.with(null as any);
      expect(uri).toBe(uri2);
      uri2 = uri.with(undefined as any);
      expect(uri).toBe(uri2);
      uri2 = uri.with({});
      expect(uri).toBe(uri2);
      uri2 = uri.with({ scheme: "foo", path: "bar/path" });
      expect(uri).toBe(uri2);
    });
  });

  describe("with, changes", () => {
    it("modifies components", () => {
      expect(URI.parse("before:some/file/path").with({ scheme: "after" }).toString()).toBe("after:some/file/path");
      expect(URI.from({ scheme: "s" }).with({ scheme: "http", path: "/api/files/test.me", query: "t=1234" }).toString()).toBe("http:/api/files/test.me?t%3D1234");
    });
  });

  describe("with, remove components", () => {
    it("removes authority and path", () => {
      expect(URI.parse("scheme://authority/path").with({ authority: "" }).toString()).toBe("scheme:/path");
      expect(URI.parse("scheme:/path").with({ authority: "authority" }).with({ authority: "" }).toString()).toBe("scheme:/path");
      expect(URI.parse("scheme:/path").with({ authority: "authority" }).with({ authority: null }).toString()).toBe("scheme:/path");
      expect(URI.parse("scheme:/path").with({ authority: "authority" }).with({ path: "" }).toString()).toBe("scheme://authority");
      expect(URI.parse("scheme:/path").with({ authority: "authority" }).with({ path: null }).toString()).toBe("scheme://authority");
    });
  });

  describe("with, validation", () => {
    it("throws on invalid scheme or path", () => {
      const uri = URI.parse("foo:bar/path");
      expect(() => uri.with({ scheme: "fai:l" })).toThrow();
      expect(() => uri.with({ scheme: "fäil" })).toThrow();
      expect(() => uri.with({ authority: "fail" })).toThrow();
      expect(() => uri.with({ path: "//fail" })).toThrow();
    });
  });

  describe("parse", () => {
    it("parses various URI formats", () => {
      let value = URI.parse("http:/api/files/test.me?t=1234");
      expect(value.scheme).toBe("http");
      expect(value.authority).toBe("");
      expect(value.path).toBe("/api/files/test.me");
      expect(value.query).toBe("t=1234");
      expect(value.fragment).toBe("");

      value = URI.parse("http://api/files/test.me?t=1234");
      expect(value.scheme).toBe("http");
      expect(value.authority).toBe("api");
      expect(value.path).toBe("/files/test.me");
      expect(value.query).toBe("t=1234");
      expect(value.fragment).toBe("");

      value = URI.parse("file:///c:/test/me");
      expect(value.scheme).toBe("file");
      expect(value.authority).toBe("");
      expect(value.path).toBe("/c:/test/me");
      expect(value.fragment).toBe("");
      expect(value.query).toBe("");
      expect(value.fsPath).toBe(isWindows ? "c:\\test\\me" : "c:/test/me");

      value = URI.parse("file://shares/files/c%23/p.cs");
      expect(value.scheme).toBe("file");
      expect(value.authority).toBe("shares");
      expect(value.path).toBe("/files/c#/p.cs");
      expect(value.fsPath).toBe(isWindows ? "\\\\shares\\files\\c#\\p.cs" : "//shares/files/c#/p.cs");

      value = URI.parse("inmemory:");
      expect(value.scheme).toBe("inmemory");
      expect(value.authority).toBe("");
      expect(value.path).toBe("");

      value = URI.parse("foo:api/files/test");
      expect(value.scheme).toBe("foo");
      expect(value.authority).toBe("");
      expect(value.path).toBe("api/files/test");

      value = URI.parse("file:?q");
      expect(value.scheme).toBe("file");
      expect(value.path).toBe("/");
      expect(value.query).toBe("q");

      value = URI.parse("file:#d");
      expect(value.scheme).toBe("file");
      expect(value.path).toBe("/");
      expect(value.fragment).toBe("d");
    });
  });

  describe("parse, disallow //path when no authority", () => {
    it("throws on invalid URI", () => {
      expect(() => URI.parse("file:////shares/files/p.cs")).toThrow();
    });
  });

  describe("uRI#file, no path-is-uri check", () => {
    it("treats string as path, not URI", () => {
      const value = URI.file("file://path/to/file");
      expect(value.scheme).toBe("file");
      expect(value.authority).toBe("");
      expect(value.path).toBe("/file://path/to/file");
    });
  });

  describe("uRI#file, always slash", () => {
    it("prepends slash to relative paths", () => {
      let value = URI.file("a.file");
      expect(value.scheme).toBe("file");
      expect(value.path).toBe("/a.file");
      expect(value.toString()).toBe("file:///a.file");

      value = URI.parse(value.toString());
      expect(value.path).toBe("/a.file");
      expect(value.toString()).toBe("file:///a.file");
    });
  });

  describe("uRI.toString, only scheme and query", () => {
    it("handles query without path", () => {
      const value = URI.parse("stuff:?qüery");
      expect(value.toString()).toBe("stuff:?q%C3%BCery");
    });
  });

  describe("uRI#toString, upper-case percent escapes", () => {
    it("normalizes percent encoding to upper case", () => {
      const value = URI.parse("file://sh%c3%a4res/path");
      expect(value.toString()).toBe("file://sh%C3%A4res/path");
    });
  });

  describe("uRI#toString, lower-case windows drive letter", () => {
    it("lower-cases drive letters", () => {
      expect(URI.parse("untitled:c:/Users/jrieken/Code/abc.txt").toString()).toBe("untitled:c%3A/Users/jrieken/Code/abc.txt");
      expect(URI.parse("untitled:C:/Users/jrieken/Code/abc.txt").toString()).toBe("untitled:c%3A/Users/jrieken/Code/abc.txt");
    });
  });

  describe("uRI#toString, don't encode port", () => {
    it("preserves port numbers", () => {
      let value = URI.parse("http://localhost:8080/far");
      expect(value.toString()).toBe("http://localhost:8080/far");

      value = URI.from({ scheme: "http", authority: "löcalhost:8080", path: "/far" });
      expect(value.toString()).toBe("http://l%C3%B6calhost:8080/far");
    });
  });

  describe("correctFileUriToFilePath2", () => {
    it("round-trips file paths", () => {
      function test(input: string, expected: string) {
        const value = URI.parse(input);
        expect(value.fsPath).toBe(expected);
        const value2 = URI.file(value.fsPath);
        expect(value2.fsPath).toBe(expected);
        expect(value.toString()).toBe(value2.toString());
      }

      test("file:///c:/alex.txt", isWindows ? "c:\\alex.txt" : "c:/alex.txt");
      test("file://monacotools/folder/isi.txt", isWindows ? "\\\\monacotools\\folder\\isi.txt" : "//monacotools/folder/isi.txt");
      test("file://monacotools1/certificates/SSL/", isWindows ? "\\\\monacotools1\\certificates\\SSL\\" : "//monacotools1/certificates/SSL/");
    });
  });

  describe("uRI - http, query & toString", () => {
    it("round-trips query strings", () => {
      let uri = URI.parse("https://go.microsoft.com/fwlink/?LinkId=518008");
      expect(uri.query).toBe("LinkId=518008");
      expect(uri.toString(true)).toBe("https://go.microsoft.com/fwlink/?LinkId=518008");
      expect(uri.toString()).toBe("https://go.microsoft.com/fwlink/?LinkId%3D518008");

      let uri2 = URI.parse(uri.toString());
      expect(uri2.query).toBe(uri.query);

      uri = URI.parse("https://go.microsoft.com/fwlink/?LinkId=518008&foö&ké¥=üü");
      expect(uri.query).toBe("LinkId=518008&foö&ké¥=üü");
      expect(uri.toString(true)).toBe("https://go.microsoft.com/fwlink/?LinkId=518008&foö&ké¥=üü");

      uri2 = URI.parse(uri.toString());
      expect(uri2.query).toBe(uri.query);
    });
  });

  describe("class URI cannot represent relative file paths", () => {
    it("prepends slash to relative paths", () => {
      expect(URI.file("/foo/bar").path).toBe("/foo/bar");
      expect(URI.file("foo/bar").path).toBe("/foo/bar");
      expect(URI.file("./foo/bar").path).toBe("/./foo/bar");

      const fileUri1 = URI.parse("file:foo/bar");
      expect(fileUri1.path).toBe("/foo/bar");
      expect(fileUri1.authority).toBe("");
      const uri = fileUri1.toString();
      expect(uri).toBe("file:///foo/bar");
      const fileUri2 = URI.parse(uri);
      expect(fileUri2.path).toBe("/foo/bar");
      expect(fileUri2.authority).toBe("");
    });
  });

  describe("isUri", () => {
    it("identifies URI instances", () => {
      const uri = URI.file("/foo/bazz.txt");
      expect(URI.isUri(uri)).toBe(true);
      expect(URI.isUri(uri.toJSON())).toBe(false);
      expect(URI.isUri(1)).toBe(false);
      expect(URI.isUri("1")).toBe(false);
      expect(URI.isUri("http://sample.com")).toBe(false);
      expect(URI.isUri(null)).toBe(false);
      expect(URI.isUri(undefined)).toBe(false);
    });
  });

  describe("isUriComponents", () => {
    it("validates UriComponents shape", () => {
      expect(isUriComponents(URI.file("a"))).toBe(true);
      expect(isUriComponents(URI.file("a").toJSON())).toBe(true);
      expect(isUriComponents(1)).toBe(false);
      expect(isUriComponents({})).toBe(false);
      expect(isUriComponents({ scheme: "" })).toBe(true);
      expect(isUriComponents({ scheme: "fo", path: "/p" })).toBe(true);
      expect(isUriComponents({ path: "/p" })).toBe(false);
    });
  });

  describe("from, from(strict), revive", () => {
    it("validates in strict mode", () => {
      expect(() => URI.from({ scheme: "" }, true)).toThrow();
      expect(URI.from({ scheme: "" }).scheme).toBe("file");
      expect(URI.revive({ scheme: "" })!.scheme).toBe("");
    });
  });

  describe("uRI - (de)serialize", () => {
    it("round-trips via toJSON and revive", () => {
      const values = [
        URI.parse("http://localhost:8080/far"),
        URI.file("c:\\test with %25\\c#code"),
        URI.file("\\\\shäres\\path\\c#\\plugin.json"),
        URI.parse("http://api/files/test.me?t=1234"),
        URI.parse("http://api/files/test.me?t=1234#fff"),
        URI.parse("http://api/files/test.me#fff"),
      ];

      for (const value of values) {
        const data = value.toJSON();
        const clone = URI.revive(data);

        expect(clone.scheme).toBe(value.scheme);
        expect(clone.authority).toBe(value.authority);
        expect(clone.path).toBe(value.path);
        expect(clone.query).toBe(value.query);
        expect(clone.fragment).toBe(value.fragment);
        expect(clone.fsPath).toBe(value.fsPath);
        expect(clone.toString()).toBe(value.toString());
      }
    });
  });

  describe("uRI#joinPath", () => {
    function assertJoined(base: string, fragment: string, expected: string) {
      const baseUri = URI.parse(base);
      const newUri = URI.joinPath(baseUri, fragment);
      expect(newUri.toString(true)).toBe(expected);
    }

    it("joins path fragments", () => {
      assertJoined("file:///foo/", "../../bazz", "file:///bazz");
      assertJoined("file:///foo", "../../bazz", "file:///bazz");
      assertJoined("file:///foo/bar/", "./bazz", "file:///foo/bar/bazz");
      assertJoined("file:///foo/bar", "bazz", "file:///foo/bar/bazz");
      assertJoined("file:", "bazz", "file:///bazz");
      assertJoined("http://domain", "bazz", "http://domain/bazz");
      assertJoined("https://domain", "bazz", "https://domain/bazz");
      assertJoined("foo:/", "bazz", "foo:/bazz");
      assertJoined("foo://bar/", "bazz", "foo://bar/bazz");
    });

    it("throws on invalid join", () => {
      expect(() => URI.joinPath(URI.parse("foo:"), "bazz")).toThrow();
    });
  });

  describe("vscode-uri: URI.toString() wrongly encode IPv6 literals", () => {
    it("preserves IPv6 brackets", () => {
      expect(URI.parse("http://[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html").toString()).toBe("http://[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/index.html");
      expect(URI.parse("http://user@[FEDC:BA98:7654:3210:FEDC:BA98:7654:3210]:80/index.html").toString()).toBe("http://user@[fedc:ba98:7654:3210:fedc:ba98:7654:3210]:80/index.html");
    });
  });
});
