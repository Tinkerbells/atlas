import type { RemoteFileSystemClient } from "~/common/fs/remote-fs-protocol";

import { ILogger } from "~/common/logger";
import { DiskFileSystemProvider } from "~/main/fs";
import { mainRpcRegistry } from "~/main/messaging/electron-main-rpc";
import { FileSystemProviderServer } from "~/main/fs/remote-fs-server";
import { RpcProtocolImpl, RpcProxyFactory } from "~/common/messaging/rpc-protocol";
import { createDecorator, InstantiationType, registerSingleton } from "~/common/di";

export interface IFSService {
  readonly _serviceBrand: undefined;
}

export const IFSService = createDecorator<IFSService>("fsService");

export class FSService implements IFSService {
  readonly _serviceBrand = undefined as undefined;
  private readonly provider = new DiskFileSystemProvider();
  private readonly server = new FileSystemProviderServer(this.provider);

  constructor(
    @ILogger private readonly logger: ILogger,
  ) {
    this._registerRpcHandlers();
  }

  private _registerRpcHandlers(): void {
    this.logger.info("FSService: registering RPC handlers");

    mainRpcRegistry.onDidCreateConnection((connection) => {
      this._setupConnection(connection);
    });
  }

  private async _setupConnection(connection: { multiplexer: { open: (id: string) => Promise<any> } }): Promise<void> {
    const channel = await connection.multiplexer.open("remote-filesystem");
    const protocol = new RpcProtocolImpl(channel);

    const clientProxy = new RpcProxyFactory<RemoteFileSystemClient>(protocol).createNotifyProxy();
    this.server.setClient(clientProxy);
    protocol.setTarget(this.server);

    this.logger.info(`FSService: RPC filesystem server registered for window`);
  }
}

registerSingleton(IFSService, FSService, InstantiationType.Eager);
