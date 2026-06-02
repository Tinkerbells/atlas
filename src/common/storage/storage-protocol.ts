export const storageIpcChannel = "storage";

export interface IStorageQueries {
  "storage:get": (key: string, defaultValue?: unknown) => Promise<unknown>;
  "storage:set": (key: string, value: unknown) => Promise<void>;
  "storage:delete": (key: string) => Promise<void>;

  "theme:get": () => Promise<string | undefined>;
  "theme:set": (theme: string) => Promise<void>;

  "recentFiles:get": () => Promise<string[]>;
  "recentFiles:add": (uri: string) => Promise<void>;
  "recentFiles:remove": (uri: string) => Promise<void>;

  "bookmarks:get": () => Promise<string[]>;
  "bookmarks:add": (uri: string) => Promise<void>;
  "bookmarks:remove": (uri: string) => Promise<void>;
}

export interface IStorageEvents {
  "storage:change": (key: string, value: unknown) => void;
}
