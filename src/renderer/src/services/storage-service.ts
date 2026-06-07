import { storageRpc } from "../messaging/services/rpc-proxies";

export const storageService = {
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const proxy = await storageRpc.get();
    return proxy.get(key, defaultValue) as Promise<T | undefined>;
  },
  async set<T>(key: string, value: T): Promise<void> {
    const proxy = await storageRpc.get();
    await proxy.set(key, value);
  },
  async delete(key: string): Promise<void> {
    const proxy = await storageRpc.get();
    await proxy.delete(key);
  },
};
