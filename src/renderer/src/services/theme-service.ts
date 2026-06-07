import { themeRpc } from "../messaging/services/rpc-proxies";

export const themeService = {
  async get(): Promise<string | undefined> {
    const proxy = await themeRpc.get();
    return proxy.get();
  },
  async set(theme: string): Promise<void> {
    const proxy = await themeRpc.get();
    await proxy.set(theme);
  },
};
