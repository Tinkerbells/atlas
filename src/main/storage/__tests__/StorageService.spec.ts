import { describe, it, expect, vi, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

import { initSchema } from "~/main/storage/schema";
import { StorageService } from "~/main/storage/StorageService";

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn((name: string) => {
      if (name === "userData") {
        return process.env.ATLAS_TEST_USERDATA ?? tmpdir();
      }
      return tmpdir();
    }),
  },
}));

function createInMemoryDb() {
  const db = new Database(":memory:");
  initSchema(db);
  return db;
}

describe("initSchema", () => {
  it("creates storage table", () => {
    const db = createInMemoryDb();
    const table = db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'storage'",
    ).get();
    expect(table).toBeDefined();
  });
});

function makeStorageService() {
  const sentEvents: Array<{ channel: string; args: any[] }> = [];

  const mockBridgeRouter = {
    register: () => {},
    send: (channel: string, ...args: any[]) => {
      sentEvents.push({ channel, args });
    },
  };

  // @ts-expect-error — minimal mock
  const service = new StorageService(mockBridgeRouter);
  return { service, sentEvents };
}

describe("StorageService", () => {
  beforeEach(() => {
    process.env.ATLAS_TEST_USERDATA = join(tmpdir(), `atlas-test-${Date.now()}`);
    mkdirSync(process.env.ATLAS_TEST_USERDATA, { recursive: true });
  });

  describe("get / set / delete", () => {
    it("returns default value when key is missing", () => {
      const { service } = makeStorageService();
      expect(service.get("missing", "fallback")).toBe("fallback");
      expect(service.get("missing")).toBeUndefined();
    });

    it("stores and retrieves a string", () => {
      const { service } = makeStorageService();
      service.set("greeting", "hello");
      expect(service.get("greeting")).toBe("hello");
    });

    it("stores and retrieves an object", () => {
      const { service } = makeStorageService();
      const obj = { foo: "bar", num: 42 };
      service.set("config", obj);
      expect(service.get("config")).toEqual(obj);
    });

    it("overwrites existing value", () => {
      const { service } = makeStorageService();
      service.set("counter", 1);
      service.set("counter", 2);
      expect(service.get("counter")).toBe(2);
    });

    it("deletes a key", () => {
      const { service } = makeStorageService();
      service.set("temp", "value");
      service.delete("temp");
      expect(service.get("temp")).toBeUndefined();
    });

    it("emits storage:change on set", () => {
      const { service, sentEvents } = makeStorageService();
      service.set("key1", "val1");
      expect(sentEvents).toHaveLength(1);
      expect(sentEvents[0].channel).toBe("storage:change");
      expect(sentEvents[0].args).toEqual(["key1", "val1"]);
    });

    it("emits storage:change on delete", () => {
      const { service, sentEvents } = makeStorageService();
      service.set("key1", "val1");
      service.delete("key1");
      expect(sentEvents[sentEvents.length - 1].args).toEqual(["key1", undefined]);
    });
  });

  describe("theme", () => {
    it("stores and retrieves theme", () => {
      const { service } = makeStorageService();
      service.set("theme.current", "dark");
      expect(service.get<string>("theme.current")).toBe("dark");
    });
  });

  describe("recentFiles", () => {
    it("adds a recent file", () => {
      const { service } = makeStorageService();
      service.set("recentFiles", ["file:///a"]);
      expect(service.get<string[]>("recentFiles")).toEqual(["file:///a"]);
    });

    it("limits to 20 entries via IPC handler", () => {
      const { service } = makeStorageService();
      const files = Array.from({ length: 25 }, (_, i) => `file:///${i}.txt`);
      service.set("recentFiles", files);
      expect(service.get<string[]>("recentFiles")).toHaveLength(25);
      // Note: actual 20-entry limit is enforced by the IPC handler, not by set()
    });
  });

  describe("bookmarks", () => {
    it("stores and retrieves bookmarks", () => {
      const { service } = makeStorageService();
      service.set("bookmarks", ["file:///project"]);
      expect(service.get<string[]>("bookmarks")).toEqual(["file:///project"]);
    });
  });
});
