import type { INodeProcess, SpawnOptions, SpawnResult } from "@platform/node-process/common/node-process";
import type { IEnvironmentMainService } from "@platform/environment/electron-main/environment-main-service";

import { Buffer } from "node:buffer";
import { rgPath } from "@vscode/ripgrep";
import { spawn } from "node:child_process";

const BINARIES: Record<string, string> = {
  rg: rgPath.replace(/\bnode_modules\.asar\b/, "node_modules.asar.unpacked"),
};

export class NodeProcessService implements INodeProcess {
  declare readonly _serviceBrand: undefined;

  constructor(private environmentMainService: IEnvironmentMainService) {}

  spawn(options: SpawnOptions): Promise<SpawnResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(options.command, options.args, { cwd: options.cwd });
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      child.stdout!.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
      child.stderr!.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

      child.on("error", err => reject(err));
      child.on("close", (code) => {
        resolve({
          code,
          stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
          stderr: Buffer.concat(stderrChunks).toString("utf-8"),
        });
      });
    });
  }

  getBinary(name: string): Promise<string> {
    const path = BINARIES[name] ?? "";
    if (!path) {
      return Promise.reject(new Error(`Binary "${name}" not found`));
    }
    return Promise.resolve(path);
  }

  getHome(): Promise<string> {
    return Promise.resolve(this.environmentMainService.app.getPath("home"));
  }
}
