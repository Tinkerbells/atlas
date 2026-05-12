import type { IDatabaseService, IMigration } from "@platform/common/database";

export const initialSchemaMigration: IMigration = {
  version: 1,
  name: "initial-schema",
  up(db: IDatabaseService): void {
    db.exec(`
      CREATE TABLE files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uri TEXT NOT NULL UNIQUE,
        scheme TEXT NOT NULL DEFAULT 'file',
        path TEXT NOT NULL,
        parent_path TEXT NOT NULL,
        name TEXT NOT NULL,
        stem TEXT NOT NULL,
        extension TEXT,
        size INTEGER DEFAULT 0,
        modified_time INTEGER,
        created_time INTEGER,
        is_directory INTEGER NOT NULL DEFAULT 0,
        is_hidden INTEGER NOT NULL DEFAULT 0,
        drive TEXT NOT NULL,
        last_seen INTEGER NOT NULL
      );

      CREATE INDEX idx_files_parent ON files(parent_path);
      CREATE INDEX idx_files_drive ON files(drive);
      CREATE INDEX idx_files_modified ON files(modified_time);

      CREATE VIRTUAL TABLE files_fts USING fts5(
        name, path,
        content='files',
        content_rowid='id'
      );

      CREATE TRIGGER files_ai AFTER INSERT ON files BEGIN
        INSERT INTO files_fts(rowid, name, path) VALUES (NEW.id, NEW.name, NEW.path);
      END;

      CREATE TRIGGER files_ad AFTER DELETE ON files BEGIN
        INSERT INTO files_fts(files_fts, rowid, name, path) VALUES ('delete', OLD.id, OLD.name, OLD.path);
      END;

      CREATE TRIGGER files_au AFTER UPDATE ON files BEGIN
        INSERT INTO files_fts(files_fts, rowid, name, path) VALUES ('delete', OLD.id, OLD.name, OLD.path);
        INSERT INTO files_fts(rowid, name, path) VALUES (NEW.id, NEW.name, NEW.path);
      END;

      CREATE TABLE scan_metadata (
        drive TEXT PRIMARY KEY,
        last_scan_time INTEGER,
        file_count INTEGER DEFAULT 0,
        scan_duration_ms INTEGER DEFAULT 0
      );
    `);
  },
};
