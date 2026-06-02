import type { IQueries, IEvents } from "~/common/bridge";

export interface Api {
  process: { versions: Record<string, string> };

  logger: {
    log: IQueries["logger:log"];
  };

  system: {
    ping: IQueries["ping"];
  };

  events: {
    on: <K extends keyof IEvents>(channel: K, callback: IEvents[K]) => () => void;
  };
}

declare global {
  interface Window {
    api: Api;
  }
}
