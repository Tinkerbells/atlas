import { ipcRenderer } from "electron";

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

export interface SpawnStreamHandle {
  processId: string;
  onStdout: (callback: (chunk: string) => void) => () => void;
  onStderr: (callback: (chunk: string) => void) => () => void;
  onClose: (callback: (info: { code: number | null }) => void) => () => void;
  onError: (callback: (info: { message: string }) => void) => () => void;
  kill: () => Promise<void>;
}

export function spawnProcess(options: SpawnOptions): Promise<SpawnResult> {
  return ipcRenderer.invoke("node:spawn", options);
}

export function spawnStream(options: SpawnOptions): Promise<SpawnStreamHandle> {
  return ipcRenderer.invoke("node:spawn-stream", options).then((processId: string) => {
    const channels = {
      stdout: `node:spawn-stream:${processId}:stdout`,
      stderr: `node:spawn-stream:${processId}:stderr`,
      close: `node:spawn-stream:${processId}:close`,
      error: `node:spawn-stream:${processId}:error`,
    };

    function cleanup() {
      for (const ch of Object.values(channels)) {
        ipcRenderer.removeAllListeners(ch);
      }
    }

    return {
      processId,
      onStdout(cb) {
        const handler = (_event: any, data: string) => cb(data);
        ipcRenderer.on(channels.stdout, handler);
        return () => ipcRenderer.removeListener(channels.stdout, handler);
      },
      onStderr(cb) {
        const handler = (_event: any, data: string) => cb(data);
        ipcRenderer.on(channels.stderr, handler);
        return () => ipcRenderer.removeListener(channels.stderr, handler);
      },
      onClose(cb) {
        const handler = (_event: any, info: { code: number | null }) => {
          cb(info);
          cleanup();
        };
        ipcRenderer.on(channels.close, handler);
        return () => ipcRenderer.removeListener(channels.close, handler);
      },
      onError(cb) {
        const handler = (_event: any, info: { message: string }) => {
          cb(info);
          cleanup();
        };
        ipcRenderer.on(channels.error, handler);
        return () => ipcRenderer.removeListener(channels.error, handler);
      },
      kill() {
        return ipcRenderer.invoke("node:kill", processId);
      },
    };
  });
}

export function killProcess(processId: string): Promise<void> {
  return ipcRenderer.invoke("node:kill", processId);
}

export function getNodeBinary(name: string): Promise<string | null> {
  return ipcRenderer.invoke("node:binary", name);
}

export function getHome(): Promise<string> {
  return ipcRenderer.invoke("node:home");
}
