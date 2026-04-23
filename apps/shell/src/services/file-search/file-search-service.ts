import { Disposable } from "@atlas/shared";
import { createDecorator, InstantiationType, registerSingleton } from "@atlas/di";

import type { IFileSearchQuery } from "./types";
import type { SpawnStreamHandle } from "../node-process/types";

import { ILogger } from "../logger/logger";
import { INodeProcess } from "../node-process/types";

export interface IFileSearchService {
  readonly _serviceBrand: undefined;

  search: (query: IFileSearchQuery, signal?: AbortSignal) => Promise<string[]>;
}

export const IFileSearchService = createDecorator<IFileSearchService>("fileSearchService");

const DEFAULT_EXCLUDES = [
  ".git",
  "node_modules",
  ".cache",
  ".npm",
  ".yarn",
  ".pnp",
  ".cargo",
  ".rustup",
  "__pycache__",
  ".venv",
  "venv",
  ".env",
  ".Trash",
  ".DS_Store",
  ".Thumbnails",
  "*.pyc",
  "*.pyo",
  ".idea",
  ".vscode",
  ".webpack",
  ".turbo",
  ".next",
  ".nuxt",
  "dist",
  "build",
  "out",
  "target",
  ".gradle",
  ".mvn",
  ".classpath",
  ".project",
  ".settings",
  "Library",
  "Applications",
  ".local",
  ".mozilla",
  ".thunderbird",
  ".ollama",
  ".cursor",
  "*.asar",
  "*.wasm",
  ".docker",
  ".kube",
  ".android",
  ".nuget",
  ".gradle",
  ".pnpm-store",
];

const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry {
  paths: string[];
  timestamp: number;
}

export class FileSearchService extends Disposable implements IFileSearchService {
  declare readonly _serviceBrand: undefined;

  private _rgPath: string | undefined;
  private _cache = new Map<string, CacheEntry>();
  private _inFlight = new Map<string, Promise<string[]>>();

  constructor(
    @INodeProcess private _nodeProcess: INodeProcess,
    @ILogger private _logger: ILogger,
  ) {
    super();
  }

  async search(query: IFileSearchQuery, signal?: AbortSignal): Promise<string[]> {
    const folder = query.folder;

    const cached = this._cache.get(folder);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      this._logger.info(`search: cache hit for "${folder}" (${cached.paths.length} paths)`, { scope: "FileSearchService" });
      return cached.paths;
    }

    const inFlight = this._inFlight.get(folder);
    if (inFlight) {
      this._logger.info(`search: dedup — awaiting in-flight spawn for "${folder}"`, { scope: "FileSearchService" });
      return inFlight;
    }

    const promise = this._doSearch(query, signal);
    this._inFlight.set(folder, promise);

    try {
      const results = await promise;
      this._cache.set(folder, { paths: results, timestamp: Date.now() });
      this._logger.info(`search: cached ${results.length} paths for "${folder}"`, { scope: "FileSearchService" });
      return results;
    }
    finally {
      this._inFlight.delete(folder);
    }
  }

  private async _doSearch(query: IFileSearchQuery, signal?: AbortSignal): Promise<string[]> {
    this._rgPath ??= await this._nodeProcess.getBinary("rg");

    const args = this._buildArgs(query);

    this._logger.info(`search: cwd="${query.folder}", args=${args.join(" ")}`, {
      scope: "FileSearchService",
    });

    const handle = await this._nodeProcess.spawnStream({
      command: this._rgPath,
      args,
      cwd: query.folder,
    });

    if (signal?.aborted) {
      await handle.kill();
      throw new DOMException("Aborted", "AbortError");
    }

    return this._collectOutput(handle, signal);
  }

  private _collectOutput(handle: SpawnStreamHandle, signal?: AbortSignal): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      let output = "";
      let errorOutput = "";
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled)
          return;
        settled = true;
        signal?.removeEventListener("abort", onAbort);
        fn();
      };

      const onAbort = () => {
        settle(() => {
          handle.kill();
          reject(new DOMException("Aborted", "AbortError"));
        });
      };

      signal?.addEventListener("abort", onAbort, { once: true });

      handle.onStdout((chunk) => {
        output += chunk;
      });

      handle.onStderr((chunk) => {
        errorOutput += chunk;
      });

      handle.onClose(({ code }) => {
        settle(() => {
          if (code !== 0 && code !== 1) {
            this._logger.error(`search: rg failed with code ${code}: ${errorOutput}`, { scope: "FileSearchService" });
            reject(new Error(`rg exited with code ${code}: ${errorOutput}`));
            return;
          }

          const results = this._parseOutput(output);
          this._logger.info(`search: parsed ${results.length} results${results.length > 0 ? `, first 3: ${results.slice(0, 3).join(", ")}` : ""}`, {
            scope: "FileSearchService",
          });
          resolve(results);
        });
      });

      handle.onError(({ message }) => {
        settle(() => {
          this._logger.error(`search: spawn error: ${message}`, { scope: "FileSearchService" });
          reject(new Error(`rg spawn error: ${message}`));
        });
      });
    });
  }

  private _buildArgs(query: IFileSearchQuery): string[] {
    const args = [
      "--files",
      "--hidden",
      "--case-sensitive",
      "--no-require-git",
      "--no-config",
    ];

    for (const pattern of DEFAULT_EXCLUDES) {
      args.push("-g", `!${pattern}`);
    }

    if (query.includePattern) {
      for (const pattern of query.includePattern) {
        args.push("-g", pattern);
      }
    }

    if (query.excludePattern) {
      for (const pattern of query.excludePattern) {
        args.push("-g", `!${pattern}`);
      }
    }

    args.push(".");

    return args;
  }

  private _parseOutput(stdout: string): string[] {
    return stdout.split("\n").filter(line => line.length > 0);
  }
}

registerSingleton(IFileSearchService, FileSearchService, InstantiationType.Delayed);
