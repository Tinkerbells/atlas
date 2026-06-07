/// <reference types="vite/client" />

interface Window {
  api: {
    process: {
      versions: Record<string, string>;
    };
    rpc: {
      send: (data: Uint8Array) => void;
      onMessage: (handler: (data: Uint8Array) => void) => (() => void);
    };
    events: {
      on: (channel: string, callback: (...args: any[]) => void) => (() => void);
    };
  };
}
