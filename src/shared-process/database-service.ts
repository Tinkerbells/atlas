import type { IDatabaseService, IMigration, IPreparedStatement } from "@platform/common/database";

import Database from "better-sqlite3";

export class DatabaseService implements IDatabaseService {
  declare readonly _serviceBrand: undefined;
  private _db: Database.Database;
  private _migrations: IMigration[] = [];

  constructor(dbPath: string) {
    this._db = new Database(dbPath);
    this._db.pragma("journal_mode = WAL");
    this._db.pragma("foreign_keys = ON");
  }

  registerMigrations(migrations: IMigration[]): void {
    this._migrations.push(...migrations);
  }

  exec(sql: string): void {
    this._db.exec(sql);
  }

  prepare<Params extends unknown[], Result>(sql: string): IPreparedStatement<Params, Result> {
    const stmt = this._db.prepare(sql);
    return {
      run: (...params: Params) => stmt.run(...params),
      get: (...params: Params) => stmt.get(...params) as Result | undefined,
      all: (...params: Params) => stmt.all(...params) as Result[],
    };
  }

  transaction<T>(fn: () => T): T {
    return this._db.transaction(fn)();
  }

  migrate(): void {
    this._db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

    const getApplied = this._db.prepare("SELECT version FROM _migrations");
    const applied = new Set((getApplied.all() as { version: number }[]).map(r => r.version));

    const insertMigration = this._db.prepare("INSERT INTO _migrations (version, name) VALUES (?, ?)");

    const pending = this._migrations
      .filter(m => !applied.has(m.version))
      .sort((a, b) => a.version - b.version);

    for (const migration of pending) {
      const migrateTxn = this._db.transaction(() => {
        migration.up(this);
        insertMigration.run(migration.version, migration.name);
      });
      migrateTxn();
    }
  }

  close(): void {
    this._db.close();
  }

  dispose(): void {
    this.close();
  }
}
