import type { IChannel, IChannelClient } from "@core/ipc/ipc";

import { Emitter } from "@core/base/event";
import { Disposable } from "@core/base/lifecycle";
import { ChannelClient } from "@core/ipc/ipc-client";

class ElectronClientProtocol extends Disposable {
  private _onMessage = new Emitter<any>();
  readonly onMessage = this._onMessage.event;

  constructor() {
    super();
    (window as any).app.ipcOn("app:message", (response: any) => {
      this._onMessage.fire(response);
    });
  }

  send(message: any): void {
    (window as any).app.ipcSend("app:message", message);
  }
}

export class ElectronIPCClient extends Disposable implements IChannelClient {
  private readonly _client: ChannelClient;

  constructor() {
    super();
    const protocol = new ElectronClientProtocol();
    this._client = new ChannelClient(protocol);

    // Say hello to main process
    (window as any).app.ipcSend("app:hello");
  }

  getChannel<T extends IChannel>(channelName: string): T {
    return this._client.getChannel(channelName) as T;
  }
}
