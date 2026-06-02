import log from "electron-log";
import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

const api = {
  process: electronAPI.process,

  logger: {
    log: (level: string, message: string, ...args: any[]) =>
      ipcRenderer.invoke("logger:log", level, message, ...args),
  },

  system: {
    ping: () => ipcRenderer.invoke("ping"),
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
