import type { ILogger } from "~/services/logger/logger";
import type { CommandPaletteGroup, CommandPaletteItem } from "@nuxt/ui";
import type { IFileSearchService } from "~/services/file-search/file-search-service";

import { basename, dirname } from "@atlas/shared";

import type { IQuickAccessProvider } from "./types";

export class FileSearchProvider implements IQuickAccessProvider {
  private _folder: string;

  constructor(
    private _fileSearchService: IFileSearchService,
    folder: string,
    private _logger: ILogger,
  ) {
    this._folder = folder;
  }

  setFolder(folder: string): void {
    this._logger.info(`folder updated: ${folder}`, { scope: "FileSearchProvider" });
    this._folder = folder;
  }

  async getPicks(filter: string, signal: AbortSignal): Promise<CommandPaletteGroup[]> {
    this._logger.info(`getPicks: folder="${this._folder}", filter="${filter}"`, { scope: "FileSearchProvider" });

    const paths = await this._fileSearchService.search(
      {
        folder: this._folder,
      },
      signal,
    );

    this._logger.info(`getPicks: got ${paths.length} paths`, { scope: "FileSearchProvider" });

    const filtered = filter
      ? this._filterPaths(paths, filter)
      : paths;

    const limited = filtered.slice(0, 50);

    const items: CommandPaletteItem[] = limited.map((filePath) => {
      const label = basename(filePath);
      const dir = dirname(filePath);
      const suffix = dir === "." ? undefined : dir;

      return {
        label,
        suffix,
        onSelect: () => {
          console.log(`selected: ${filePath}`);
        },
      };
    });

    return [
      {
        id: "files",
        label: filter ? `Files matching "${filter}"` : "Files",
        items,
        ignoreFilter: true,
      },
    ];
  }

  private _filterPaths(paths: string[], filter: string): string[] {
    const lower = filter.toLowerCase();
    return paths.filter((p) => {
      const name = p.toLowerCase();
      const slashIndex = name.lastIndexOf("/");
      const base = slashIndex >= 0 ? name.slice(slashIndex + 1) : name;
      return base.includes(lower) || name.includes(lower);
    });
  }
}
