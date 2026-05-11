import type { IDisposable } from "@core/base/lifecycle";
import type { IChannel, IChannelClient } from "@core/ipc/ipc";

import { Disposable } from "@core/base/lifecycle";
import { createDecorator } from "@core/di/instantiation";
import { ElectronIPCClient } from "@core/ipc/electron-browser/ipc.electron";

export interface IMainProcessService extends IChannelClient, IDisposable {
  readonly _serviceBrand: undefined;
}

export const IMainProcessService = createDecorator<IMainProcessService>("main-process-service");

export class ElectronIPCMainProcessService extends Disposable implements IMainProcessService {
  declare readonly _serviceBrand: undefined;

  private readonly _client: ElectronIPCClient;

  constructor() {
    super();
    this._client = this._register(new ElectronIPCClient());
  }

  getChannel<T extends IChannel>(channelName: string): T {
    return this._client.getChannel(channelName);
  }
}
