import type { WriteBuffer } from "~/common/messaging/buffer";

import { AbstractChannel, ChannelMultiplexer } from "~/common/messaging/channel";
import { Uint8ArrayReadBuffer, Uint8ArrayWriteBuffer } from "~/common/messaging/buffer";

export class ElectronRendererChannel extends AbstractChannel {
  constructor() {
    super();
    const dispose = window.api.rpc.onMessage((data: Uint8Array) => {
      this.onMessageEmitter.fire(() => new Uint8ArrayReadBuffer(data));
    });
    this.toDispose.add({ dispose });
  }

  getWriteBuffer(): WriteBuffer {
    const writer = new Uint8ArrayWriteBuffer();
    writer.onCommit(buffer => window.api.rpc.send(buffer));
    return writer;
  }
}

export class ElectronRendererRpcConnection {
  public readonly multiplexer: ChannelMultiplexer;

  constructor() {
    const channel = new ElectronRendererChannel();
    this.multiplexer = new ChannelMultiplexer(channel);
  }

  dispose(): void {
    this.multiplexer.dispose();
  }
}

export const rendererRpcConnection = new ElectronRendererRpcConnection();
