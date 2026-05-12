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

// VS Code pattern: forward MessagePort from main to renderer via window.postMessage
ipcRenderer.on("app:receiveSharedProcessPort", (event: Electron.IpcRendererEvent, nonce: string) => {
  // Forward the MessagePort to the renderer window
  // e.ports contains the DOM MessagePort transferred from main
  window.postMessage(nonce, "*", event.ports);
});

export type AppAPI = typeof api;
