/* ---------------------------------------------------------------------------------------------
 *  Preload script for the renderer process.
 *  This is the ONLY script that runs with Node.js privileges in the renderer.
 *  It exposes a safe subset of APIs via contextBridge.
 *-------------------------------------------------------------------------------------------- */

import { contextBridge, ipcRenderer } from "electron";

const api = {
  ipcSend(channel: string, ...args: any[]): void {
    ipcRenderer.send(channel, ...args);
  },

  ipcOn(channel: string, listener: (...args: any[]) => void): () => void {
    const wrapped = (_event: any, ...args: any[]) => listener(...args);
    ipcRenderer.on(channel, wrapped);
    return () => {
      ipcRenderer.removeListener(channel, wrapped);
    };
  },
};

contextBridge.exposeInMainWorld("app", api);

// Forward MessagePort from main to renderer for shared process communication
ipcRenderer.on("app:receiveSharedProcessPort", (_event: Electron.IpcRendererEvent, nonce: string) => {
  const port = _event.ports[0];
  if (port) {
    window.postMessage({ type: "app:sharedProcessPort", nonce }, "*", [port]);
  }
});

export type AppAPI = typeof api;
