import type { IQueries, IEvents } from "~/common/bridge";

export interface Api {
  process: { versions: Record<string, string> };

  logger: {
    log: IQueries["logger:log"];
  };

  system: {
    ping: IQueries["ping"];
  };

  storage: {
    get: IQueries["storage:get"];
    set: IQueries["storage:set"];
    delete: IQueries["storage:delete"];
  };

  theme: {
    get: IQueries["theme:get"];
    set: IQueries["theme:set"];
  };

  recentFiles: {
    get: IQueries["recentFiles:get"];
    add: IQueries["recentFiles:add"];
    remove: IQueries["recentFiles:remove"];
  };

  bookmarks: {
    get: IQueries["bookmarks:get"];
    add: IQueries["bookmarks:add"];
    remove: IQueries["bookmarks:remove"];
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
