import { createDecorator } from "@atlas/di";

export interface SpawnStreamHandle {
  processId: string;
  onStdout: (callback: (chunk: string) => void) => () => void;
  onStderr: (callback: (chunk: string) => void) => () => void;
  onClose: (callback: (info: { code: number | null }) => void) => () => void;
  onError: (callback: (info: { message: string }) => void) => () => void;
  kill: () => Promise<void>;
}

export interface INodeProcess {
  readonly _serviceBrand: undefined;

  spawn: (options: {
    command: string;
    args: string[];
    cwd: string;
  }) => Promise<{ code: number | null; stdout: string; stderr: string }>;

  spawnStream: (options: {
    command: string;
    args: string[];
    cwd: string;
  }) => Promise<SpawnStreamHandle>;

  getBinary: (name: string) => Promise<string>;
  getHome: () => Promise<string>;
}

export const INodeProcess = createDecorator<INodeProcess>("nodeProcess");
