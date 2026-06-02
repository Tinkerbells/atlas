import type { IMainQueries, IMainEvents } from '~/common/bridge/api-contract';

export const bridge = new Proxy({} as any, {
  get(_, channel: string) {
    return (...args: any[]) => {
      return window.rawIpc.invoke(channel, ...args);
    };
  }
}) as {
  [K in keyof IMainQueries]: IMainQueries[K]
};

export const events = {
  on<K extends keyof IMainEvents>(channel: K, callback: IMainEvents[K]): () => void {
    return window.rawIpc.on(channel, callback as (...args: any[]) => void);
  }
};
