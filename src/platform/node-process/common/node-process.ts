import { createDecorator } from "@/core/di/instantiation";

export interface SpawnResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export interface SpawnOptions {
  command: string;
  args: string[];
  cwd: string;
}

export interface INodeProcess {
  readonly _serviceBrand: undefined;

  spawn: (options: SpawnOptions) => Promise<SpawnResult>;
  getBinary: (name: string) => Promise<string>;
  getHome: () => Promise<string>;
}

export const INodeProcess = createDecorator<INodeProcess>("nodeProcess");
