import log from "electron-log";
import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

const api = {
  process: electronAPI.process,

  rpc: {
    send: (data: Uint8Array) => ipcRenderer.send("atlas:rpc", data),
    onMessage: (handler: (data: Uint8Array) => void) => {
      const subscription = (_event: any, data: Uint8Array) => {
        // Ensure we pass a clean Uint8Array slice to avoid Electron Buffer sharing issues
        handler(new Uint8Array(data));
      };
      ipcRenderer.on("atlas:rpc", subscription);
      return () => {
        ipcRenderer.removeListener("atlas:rpc", subscription);
      };
    },
  },

  events: {
    on: (channel: string, callback: (...args: any[]) => void): (() => void) => {
      const subscription = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", api);
  }
  catch (error) {
    log.error("[Preload] Failed to expose APIs", error);
  }
}
else {
  // @ts-expect-error (define in dts)
  window.api = api;
}
