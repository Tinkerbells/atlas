import type * as Electron from "electron";
import type { ChildProcess } from "node:child_process";

import { ipcMain } from "electron";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { rgPath } from "@vscode/ripgrep";
import { spawn } from "node:child_process";

import type { AppModule } from "../AppModule.js";

const BINARIES: Record<string, string> = {
  rg: rgPath.replace(/\bnode_modules\.asar\b/, "node_modules.asar.unpacked"),
};

class NodeProcess implements AppModule {
  private processes = new Map<string, ChildProcess>();

  enable({ app }: { app: Electron.App }): void {
    ipcMain.handle("node:spawn", async (_event, opts: {
      command: string;
      args: string[];
      cwd: string;
    }) => {
      console.log(`[NodeProcess] spawn: ${opts.command} ${opts.args.join(" ")} (cwd: ${opts.cwd})`);

      return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
        const child = spawn(opts.command, opts.args, { cwd: opts.cwd });

        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];

        child.stdout!.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
        child.stderr!.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

        child.on("error", (err) => {
          console.error(`[NodeProcess] spawn error: ${err}`);
          reject(err);
        });

        child.on("close", (code) => {
          const stdout = Buffer.concat(stdoutChunks).toString("utf-8");
          const stderr = Buffer.concat(stderrChunks).toString("utf-8");
          console.log(`[NodeProcess] spawn done: code=${code}, stdout=${stdout.length}chars, stderr="${stderr.slice(0, 200)}"`);
          resolve({ code, stdout, stderr });
        });
      });
    });

    ipcMain.handle("node:spawn-stream", (event, opts: {
      command: string;
      args: string[];
      cwd: string;
    }) => {
      const processId = randomUUID();
      const child = spawn(opts.command, opts.args, { cwd: opts.cwd });
      this.processes.set(processId, child);

      console.log(`[NodeProcess] spawn-stream: ${processId} ${opts.command} ${opts.args.join(" ")} (cwd: ${opts.cwd})`);

      const prefix = `node:spawn-stream:${processId}`;

      child.stdout!.on("data", (chunk: Buffer) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send(`${prefix}:stdout`, chunk.toString("utf-8"));
        }
      });

      child.stderr!.on("data", (chunk: Buffer) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send(`${prefix}:stderr`, chunk.toString("utf-8"));
        }
      });

      child.on("error", (err) => {
        console.error(`[NodeProcess] spawn-stream error: ${processId} ${err}`);
        if (!event.sender.isDestroyed()) {
          event.sender.send(`${prefix}:error`, { message: err.message });
        }
        this.processes.delete(processId);
      });

      child.on("close", (code) => {
        console.log(`[NodeProcess] spawn-stream close: ${processId} code=${code}`);
        if (!event.sender.isDestroyed()) {
          event.sender.send(`${prefix}:close`, { code });
        }
        this.processes.delete(processId);
      });

      return processId;
    });

    ipcMain.handle("node:kill", async (_event, processId: string) => {
      const child = this.processes.get(processId);
      if (child) {
        console.log(`[NodeProcess] kill: ${processId}`);
        child.kill("SIGTERM");
        this.processes.delete(processId);
      }
    });

    ipcMain.handle("node:binary", (_event, name: string) => {
      const path = BINARIES[name] ?? null;
      console.log(`[NodeProcess] binary("${name}"): ${path}`);
      return path;
    });

    ipcMain.handle("node:home", () => {
      const home = app.getPath("home");
      console.log(`[NodeProcess] home: ${home}`);
      return home;
    });
  }
}

export function nodeProcess(): AppModule {
  return new NodeProcess();
}
