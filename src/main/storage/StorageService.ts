import Database from "better-sqlite3";
import { app } from "electron";
import { join } from "node:path";

import { IBridgeRouter } from "~/main/bridge/BridgeRouter";
import { createDecorator, InstantiationType, registerSingleton } from "~/common/di";

import { initSchema } from "./schema";

export interface IStorageService {
  readonly _serviceBrand: undefined;
  get<T>(key: string, defaultValue?: T): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
}

export const IStorageService = createDecorator<IStorageService>("storageService");

export class StorageService implements IStorageService {
  readonly _serviceBrand = undefined as undefined;
  private readonly db: Database.Database;

  constructor(
    @IBridgeRouter private readonly bridgeRouter: IBridgeRouter,
  ) {
    const dbPath = join(app.getPath("userData"), "state.db");
    this.db = new Database(dbPath);
    initSchema(this.db);

    this._registerIpcHandlers();
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    const row = this.db
      .prepare("SELECT value FROM storage WHERE scope = ? AND key = ?")
      .get("application", key) as { value: string } | undefined;

    if (!row) {
      return defaultValue;
    }

    try {
      return JSON.parse(row.value) as T;
    }
    catch {
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    const serialized = JSON.stringify(value);
    this.db
      .prepare(
        `INSERT INTO storage (scope, key, value) VALUES (?, ?, ?)
         ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value`,
      )
      .run("application", key, serialized);

    this.bridgeRouter.send("storage:change", key, value);
  }

  delete(key: string): void {
    this.db
      .prepare("DELETE FROM storage WHERE scope = ? AND key = ?")
      .run("application", key);

    this.bridgeRouter.send("storage:change", key, undefined);
  }

  private _registerIpcHandlers(): void {
    this.bridgeRouter.register("storage:get", (key, defaultValue) => this.get(key, defaultValue));
    this.bridgeRouter.register("storage:set", (key, value) => this.set(key, value));
    this.bridgeRouter.register("storage:delete", (key) => this.delete(key));

    this.bridgeRouter.register("theme:get", () => this.get<string>("theme.current"));
    this.bridgeRouter.register("theme:set", (theme) => this.set("theme.current", theme));

    this.bridgeRouter.register("recentFiles:get", () => this.get<string[]>("recentFiles", []));
    this.bridgeRouter.register("recentFiles:add", (uri) => {
      const files = new Set(this.get<string[]>("recentFiles", []));
      files.delete(uri);
      files.add(uri);
      this.set("recentFiles", Array.from(files).slice(-20));
    });
    this.bridgeRouter.register("recentFiles:remove", (uri) => {
      const files = this.get<string[]>("recentFiles", [])!.filter((f) => f !== uri);
      this.set("recentFiles", files);
    });

    this.bridgeRouter.register("bookmarks:get", () => this.get<string[]>("bookmarks", []));
    this.bridgeRouter.register("bookmarks:add", (uri) => {
      const marks = new Set(this.get<string[]>("bookmarks", []));
      marks.add(uri);
      this.set("bookmarks", Array.from(marks));
    });
    this.bridgeRouter.register("bookmarks:remove", (uri) => {
      const marks = this.get<string[]>("bookmarks", [])!.filter((m) => m !== uri);
      this.set("bookmarks", marks);
    });
  }
}

registerSingleton(IStorageService, StorageService, InstantiationType.Eager);
