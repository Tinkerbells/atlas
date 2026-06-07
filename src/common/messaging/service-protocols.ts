export interface RemoteLoggerServer {
  log: (level: string, message: string, ...args: unknown[]) => Promise<void>;
}

export interface RemoteStorageServer {
  get: (key: string, defaultValue?: unknown) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export interface RemoteThemeServer {
  get: () => Promise<string | undefined>;
  set: (theme: string) => Promise<void>;
}

export interface RemoteRecentFilesServer {
  get: () => Promise<string[]>;
  add: (uri: string) => Promise<void>;
  remove: (uri: string) => Promise<void>;
}

export interface RemoteBookmarksServer {
  get: () => Promise<string[]>;
  add: (uri: string) => Promise<void>;
  remove: (uri: string) => Promise<void>;
}

export interface RemoteSystemServer {
  ping: () => Promise<string>;
}
