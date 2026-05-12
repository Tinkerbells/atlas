import type { IMigration } from "@platform/common/database";

import { DatabaseService } from "@shared-process/database-service";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("databaseService", () => {
  let db: DatabaseService;

  beforeEach(() => {
    db = new DatabaseService(":memory:");
  });

  afterEach(() => {
    db.dispose();
  });

  describe("exec & query", () => {
    it("executes DDL and queries data", () => {
      db.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");
      db.exec("INSERT INTO test (name) VALUES ('hello')");

      const stmt = db.prepare<[], { id: number; name: string }>("SELECT * FROM test");
      const rows = stmt.all();
      expect(rows).toHaveLength(1);
      expect(rows[0]!.name).toBe("hello");
    });
  });

  describe("prepared statement", () => {
    it("supports run/get/all", () => {
      db.exec("CREATE TABLE items (id INTEGER PRIMARY KEY, value INTEGER)");

      const insert = db.prepare<[number], unknown>("INSERT INTO items (value) VALUES (?)");
      const result = insert.run(42);
      expect(result.changes).toBe(1);
      expect(typeof result.lastInsertRowid).toBe("number");

      const get = db.prepare<[number], { value: number }>("SELECT value FROM items WHERE id = ?");
      const row = get.get(result.lastInsertRowid as number);
      expect(row!.value).toBe(42);

      const all = db.prepare<[], { value: number }>("SELECT value FROM items");
      expect(all.all()).toHaveLength(1);
    });
  });

  describe("transaction", () => {
    it("commits all changes atomically", () => {
      db.exec("CREATE TABLE txn (id INTEGER PRIMARY KEY)");

      db.transaction(() => {
        db.exec("INSERT INTO txn DEFAULT VALUES");
        db.exec("INSERT INTO txn DEFAULT VALUES");
      });

      const stmt = db.prepare<[], { id: number }>("SELECT * FROM txn");
      expect(stmt.all()).toHaveLength(2);
    });
  });

  describe("migrate", () => {
    it("runs pending migrations in order", () => {
      const migration1: IMigration = {
        version: 1,
        name: "create-users",
        up(database) {
          database.exec("CREATE TABLE users (id INTEGER PRIMARY KEY)");
        },
      };

      const migration2: IMigration = {
        version: 2,
        name: "add-name",
        up(database) {
          database.exec("ALTER TABLE users ADD COLUMN name TEXT");
        },
      };

      db.registerMigrations([migration1, migration2]);
      db.migrate();

      const stmt = db.prepare<[], { name: string }>("PRAGMA table_info(users)");
      const cols = stmt.all();
      expect(cols.some(c => c.name === "name")).toBe(true);
    });

    it("skips already applied migrations", () => {
      let callCount = 0;
      const migration: IMigration = {
        version: 1,
        name: "count",
        up() {
          callCount++;
        },
      };

      db.registerMigrations([migration]);
      db.migrate();
      db.migrate();

      expect(callCount).toBe(1);
    });

    it("runs migrations in version order", () => {
      const order: number[] = [];

      db.registerMigrations([
        {
          version: 3,
          name: "third",
          up() { order.push(3); },
        },
        {
          version: 1,
          name: "first",
          up() { order.push(1); },
        },
        {
          version: 2,
          name: "second",
          up() { order.push(2); },
        },
      ]);

      db.migrate();
      expect(order).toEqual([1, 2, 3]);
    });
  });
});
