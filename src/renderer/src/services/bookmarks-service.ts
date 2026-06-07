import { bookmarksRpc } from "../messaging/services/rpc-proxies";

export const bookmarksService = {
  async get(): Promise<string[]> {
    const proxy = await bookmarksRpc.get();
    return proxy.get();
  },
  async add(uri: string): Promise<void> {
    const proxy = await bookmarksRpc.get();
    await proxy.add(uri);
  },
  async remove(uri: string): Promise<void> {
    const proxy = await bookmarksRpc.get();
    await proxy.remove(uri);
  },
};
