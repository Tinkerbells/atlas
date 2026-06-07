import { app } from "electron";
import { join } from "node:path";
import Database from "better-sqlite3";

import { ILogger } from "~/common/logger";
import { createDecorator, InstantiationType, registerSingleton } from "~/common/di";

import { initSchema } from "./schema";

export interface IStorageService {
  readonly _serviceBrand: undefined;
  get: <T>(key: string, defaultValue?: T) => T | undefined;
  set: <T>(key: string, value: T) => void;
  delete: (key: string) => void;
}

export const IStorageService = createDecorator<IStorageService>("storageService");

export class StorageService implements IStorageService {
  readonly _serviceBrand = undefined as undefined;
  private readonly db: Database.Database;

  constructor(
    @ILogger private readonly logger: ILogger,
  ) {
    const dbPath = join(app.getPath("userData"), "state.db");
    this.logger.info("StorageService: opening database at", dbPath);
    this.db = new Database(dbPath);
    initSchema(this.db);
    this.logger.info("StorageService: schema initialized");
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    this.logger.debug("storage:get", key);

    const row = this.db
      .prepare("SELECT value FROM storage WHERE scope = ? AND key = ?")
      .get("application", key) as { value: string } | undefined;

    if (!row) {
      this.logger.debug("storage:get miss, returning default", key, defaultValue);
      return defaultValue;
    }

    try {
      const value = JSON.parse(row.value) as T;
      this.logger.debug("storage:get hit", key, value);
      return value;
    }
    catch {
      this.logger.warn("storage:get JSON parse failed for key", key, "raw:", row.value);
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    this.logger.debug("storage:set", key, value);

    const serialized = JSON.stringify(value);
    this.db
      .prepare(
        `INSERT INTO storage (scope, key, value) VALUES (?, ?, ?)
         ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value`,
      )
      .run("application", key, serialized);
  }

  delete(key: string): void {
    this.logger.debug("storage:delete", key);

    this.db
      .prepare("DELETE FROM storage WHERE scope = ? AND key = ?")
      .run("application", key);
  }
}

registerSingleton(IStorageService, StorageService, InstantiationType.Eager);
