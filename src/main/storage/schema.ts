import type Database from "better-sqlite3";

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS storage (
      scope TEXT NOT NULL DEFAULT 'application',
      key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (scope, key)
    );
  `);
}
