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

  storage: {
    get: (key: string, defaultValue?: unknown) =>
      ipcRenderer.invoke("storage:get", key, defaultValue),
    set: (key: string, value: unknown) =>
      ipcRenderer.invoke("storage:set", key, value),
    delete: (key: string) =>
      ipcRenderer.invoke("storage:delete", key),
  },

  theme: {
    get: () => ipcRenderer.invoke("theme:get"),
    set: (theme: string) => ipcRenderer.invoke("theme:set", theme),
  },

  recentFiles: {
    get: () => ipcRenderer.invoke("recentFiles:get"),
    add: (uri: string) => ipcRenderer.invoke("recentFiles:add", uri),
    remove: (uri: string) => ipcRenderer.invoke("recentFiles:remove", uri),
  },

  bookmarks: {
    get: () => ipcRenderer.invoke("bookmarks:get"),
    add: (uri: string) => ipcRenderer.invoke("bookmarks:add", uri),
    remove: (uri: string) => ipcRenderer.invoke("bookmarks:remove", uri),
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
