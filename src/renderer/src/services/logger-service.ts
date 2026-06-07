import { loggerRpc } from "../messaging/services/rpc-proxies";

export const loggerService = {
  async log(level: string, message: string, ...args: unknown[]): Promise<void> {
    const proxy = await loggerRpc.get();
    await proxy.log(level, message, ...args);
  },
};
