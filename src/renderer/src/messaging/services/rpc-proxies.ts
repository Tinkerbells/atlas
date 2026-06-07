import type {
  RemoteBookmarksServer,
  RemoteLoggerServer,
  RemoteRecentFilesServer,
  RemoteStorageServer,
  RemoteSystemServer,
  RemoteThemeServer,
} from "~/common/messaging/service-protocols";

import { RpcProtocolImpl, RpcProxyFactory } from "~/common/messaging/rpc-protocol";

import { rendererRpcConnection } from "../electron-renderer-rpc";

class RpcProxyHolder<T extends object> {
  private proxy?: T;
  private readonly promise: Promise<T>;

  constructor(channelId: string) {
    this.promise = this.createProxy(channelId);
  }

  private async createProxy(channelId: string): Promise<T> {
    const channel = await rendererRpcConnection.multiplexer.open(channelId);
    const protocol = new RpcProtocolImpl(channel);
    this.proxy = new RpcProxyFactory<T>(protocol).createProxy();
    return this.proxy;
  }

  async get(): Promise<T> {
    if (this.proxy) {
      return this.proxy;
    }
    return this.promise;
  }
}

export const loggerRpc = new RpcProxyHolder<RemoteLoggerServer>("logger");
export const storageRpc = new RpcProxyHolder<RemoteStorageServer>("storage");
export const themeRpc = new RpcProxyHolder<RemoteThemeServer>("theme");
export const recentFilesRpc = new RpcProxyHolder<RemoteRecentFilesServer>("recentFiles");
export const bookmarksRpc = new RpcProxyHolder<RemoteBookmarksServer>("bookmarks");
export const systemRpc = new RpcProxyHolder<RemoteSystemServer>("system");
