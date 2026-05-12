import type { IFileSearchService, SearchOptions, SearchResult } from "@platform/common/file-search";

import Fuse from "fuse.js";
import { IDatabaseService } from "@platform/common/database";

export class FileSearchService implements IFileSearchService {
  declare readonly _serviceBrand: undefined;

  constructor(@IDatabaseService private databaseService: IDatabaseService) {}

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    const limit = options.limit ?? 100;

    // 1. FTS5 prefix search to quickly filter candidates
    const words = query.trim().split(/\s+/).filter(Boolean);
    const ftsQuery = words.map(w => `"${w.split("\"").join("\"\"")}"*`).join(" ");

    const sql = `
      SELECT f.uri, f.name, f.path, f.size, f.modified_time, f.is_directory, f.drive
      FROM files_fts fts
      JOIN files f ON f.id = fts.rowid
      WHERE files_fts MATCH ?
        ${options.drive ? "AND f.drive = ?" : ""}
        ${!options.includeHidden ? "AND f.is_hidden = 0" : ""}
      LIMIT 5000
    `;

    const stmt = this.databaseService.prepare<
      string[],
      { uri: string; name: string; path: string; size: number; modified_time: number; is_directory: number; drive: string }
    >(sql);

    const params: string[] = [ftsQuery];
    if (options.drive) {
      params.push(options.drive);
    }

    const rows = stmt.all(...params);

    const candidates = rows.map(row => ({
      uri: row.uri,
      name: row.name,
      path: row.path,
      size: row.size,
      modifiedTime: row.modified_time,
      isDirectory: !!row.is_directory,
      drive: row.drive,
    }));

    // 2. Fuse.js fuzzy ranking on candidates
    const fuse = new Fuse(candidates, {
      keys: ["name", "path"],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });

    const fuseResults = fuse.search(query, { limit: Math.min(limit * 2, 500) });

    // 3. Apply final scoring and filtering
    const results: SearchResult[] = fuseResults.map(r => ({
      ...r.item,
      score: r.score ?? 1,
    }));

    // 4. Sort by score (lower is better) and boost directories slightly
    results.sort((a, b) => {
      let scoreA = a.score;
      let scoreB = b.score;
      if (a.isDirectory && !b.isDirectory) {
        scoreA -= 0.05;
      }
      if (b.isDirectory && !a.isDirectory) {
        scoreB -= 0.05;
      }
      return scoreA - scoreB;
    });

    return results.slice(0, limit);
  }
}
