export interface IFsQueries {
  "fs:stat": (path: string) => Promise<{ type: number; ctime: number; mtime: number; size: number }>;
  "fs:readdir": (path: string) => Promise<[string, number][]>;
  "fs:readFile": (path: string) => Promise<number[]>;
  "fs:writeFile": (path: string, content: number[]) => Promise<void>;
  "fs:delete": (path: string, options?: { recursive?: boolean; useTrash?: boolean }) => Promise<void>;
  "fs:rename": (fromPath: string, toPath: string) => Promise<void>;
  "fs:copy": (fromPath: string, toPath: string, options?: { overwrite?: boolean }) => Promise<void>;
  "fs:mkdir": (path: string) => Promise<void>;
}

export interface IFsEvents {
  "fs:change": (path: string) => void;
}
