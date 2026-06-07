import { systemRpc } from "../messaging/services/rpc-proxies";

export const systemService = {
  async ping(): Promise<string> {
    const proxy = await systemRpc.get();
    return proxy.ping();
  },
};
