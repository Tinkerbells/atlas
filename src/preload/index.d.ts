import type { ElectronAPI } from "@electron-toolkit/preload";

export interface RawIpc {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
  send: (channel: string, ...args: any[]) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    rawIpc: RawIpc;
  }
}
