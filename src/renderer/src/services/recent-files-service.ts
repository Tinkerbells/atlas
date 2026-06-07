import { recentFilesRpc } from "../messaging/services/rpc-proxies";

export const recentFilesService = {
  async get(): Promise<string[]> {
    const proxy = await recentFilesRpc.get();
    return proxy.get();
  },
  async add(uri: string): Promise<void> {
    const proxy = await recentFilesRpc.get();
    await proxy.add(uri);
  },
  async remove(uri: string): Promise<void> {
    const proxy = await recentFilesRpc.get();
    await proxy.remove(uri);
  },
};
