/* ---------------------------------------------------------------------------------------------
 *  Renderer-side client for shared process via DOM MessagePort.
 *-------------------------------------------------------------------------------------------- */

import type { IChannel, IChannelClient } from "@core/ipc/ipc";

import { Emitter } from "@core/base/event";
import { Disposable } from "@core/base/lifecycle";
import { ChannelClient } from "@core/ipc/ipc-client";

/**
 * Protocol over DOM MessagePort (uses .onmessage / .postMessage)
 */
class MessagePortProtocol extends Disposable {
  private _onMessage = new Emitter<any>();
  readonly onMessage = this._onMessage.event;

  constructor(private port: MessagePort) {
    super();
    port.onmessage = (event) => {
      this._onMessage.fire(event.data);
    };
    port.start();
  }

  send(message: any): void {
    this.port.postMessage(message);
  }

  dispose(): void {
    this.port.close();
  }
}

export class MessagePortClient extends Disposable implements IChannelClient {
  private readonly _client: ChannelClient;

  constructor(port: MessagePort) {
    super();
    const protocol = new MessagePortProtocol(port);
    this._client = new ChannelClient(protocol);
  }

  getChannel<T extends IChannel>(channelName: string): T {
    return this._client.getChannel(channelName) as T;
  }

  override dispose(): void {
    this._client.dispose();
    super.dispose();
  }
}
