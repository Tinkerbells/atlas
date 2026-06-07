import type { Event, IDisposable } from "../event";
import type { ReadBuffer, WriteBuffer } from "./buffer";

import { Emitter } from "../event";
import { DisposableStore, toDisposable } from "../lifecycle";

export interface ChannelCloseEvent {
  reason: string;
  code?: number;
}

export type MessageProvider = () => ReadBuffer;

export interface Channel {
  onClose: Event<ChannelCloseEvent>;
  onError: Event<unknown>;
  onMessage: Event<MessageProvider>;
  getWriteBuffer: () => WriteBuffer;
  close: () => void;
}

export abstract class AbstractChannel implements Channel {
  onCloseEmitter = new Emitter<ChannelCloseEvent>();
  get onClose(): Event<ChannelCloseEvent> {
    return this.onCloseEmitter.event;
  }

  onErrorEmitter = new Emitter<unknown>();
  get onError(): Event<unknown> {
    return this.onErrorEmitter.event;
  }

  onMessageEmitter = new Emitter<MessageProvider>();
  get onMessage(): Event<MessageProvider> {
    return this.onMessageEmitter.event;
  }

  protected toDispose: DisposableStore = new DisposableStore();

  constructor() {
    this.toDispose.add(this.onCloseEmitter);
    this.toDispose.add(this.onErrorEmitter);
    this.toDispose.add(this.onMessageEmitter);
  }

  close(): void {
    this.toDispose.dispose();
  }

  abstract getWriteBuffer(): WriteBuffer;
}

export class BasicChannel extends AbstractChannel {
  constructor(protected writeBufferProvider: () => WriteBuffer) {
    super();
  }

  getWriteBuffer(): WriteBuffer {
    return this.writeBufferProvider();
  }
}

export class ForwardingChannel extends AbstractChannel {
  constructor(readonly id: string, protected readonly closeHandler: () => void, protected readonly writeBufferSource: () => WriteBuffer) {
    super();
  }

  getWriteBuffer(): WriteBuffer {
    return this.writeBufferSource();
  }

  override close(): void {
    super.close();
    this.closeHandler();
  }
}

export enum MessageTypes {
  Open = 1,
  Close = 2,
  AckOpen = 3,
  Data = 4,
}

export class ChannelMultiplexer implements IDisposable {
  private pendingOpen = new Map<string, { resolve: (channel: ForwardingChannel) => void; reject: (err: Error) => void }[]>();
  protected openChannels = new Map<string, ForwardingChannel>();

  protected readonly onOpenChannelEmitter = new Emitter<{ id: string; channel: Channel }>();
  get onDidOpenChannel(): Event<{ id: string; channel: Channel }> {
    return this.onOpenChannelEmitter.event;
  }

  protected toDispose = new DisposableStore();

  constructor(protected readonly underlyingChannel: Channel) {
    this.toDispose.add(this.underlyingChannel.onMessage(buffer => this.handleMessage(buffer())));
    this.toDispose.add(this.underlyingChannel.onClose(event => this.onUnderlyingChannelClose(event)));
    this.toDispose.add(this.underlyingChannel.onError(error => this.handleError(error)));
    this.toDispose.add(this.onOpenChannelEmitter);
  }

  protected handleError(error: unknown): void {
    this.openChannels.forEach((channel) => {
      channel.onErrorEmitter.fire(error);
    });
  }

  onUnderlyingChannelClose(event?: ChannelCloseEvent): void {
    if (!this.toDispose.isDisposed) {
      this.toDispose.add(toDisposable(() => {
        const reason = event?.reason ?? "Multiplexer main channel has been closed from the remote side!";
        for (const pending of this.pendingOpen.values()) {
          for (const listener of pending) {
            listener.reject(new Error(reason));
          }
        }
        this.pendingOpen.clear();
        this.openChannels.forEach((channel) => {
          channel.onCloseEmitter.fire(event ?? { reason });
        });
        this.openChannels.clear();
      }));
      this.dispose();
    }
  }

  protected handleMessage(buffer: ReadBuffer): void {
    const type = buffer.readUint8();
    const id = buffer.readString();
    switch (type) {
      case MessageTypes.AckOpen: {
        return this.handleAckOpen(id);
      }
      case MessageTypes.Open: {
        return this.handleOpen(id);
      }
      case MessageTypes.Close: {
        return this.handleClose(id);
      }
      case MessageTypes.Data: {
        return this.handleData(id, buffer);
      }
    }
  }

  protected handleAckOpen(id: string): void {
    const pending = this.pendingOpen.get(id);
    if (pending) {
      const channel = this.createChannel(id);
      this.pendingOpen.delete(id);
      this.openChannels.set(id, channel);
      for (const listener of pending) {
        listener.resolve(channel);
      }
      this.onOpenChannelEmitter.fire({ id, channel });
    }
    else {
      console.error(`not expecting ack-open for ${id}`);
    }
  }

  protected handleOpen(id: string): void {
    if (!this.openChannels.has(id)) {
      const channel = this.createChannel(id);
      this.openChannels.set(id, channel);
      const pending = this.pendingOpen.get(id);
      if (pending) {
        for (const listener of pending) {
          listener.resolve(channel);
        }
      }
      this.underlyingChannel.getWriteBuffer().writeUint8(MessageTypes.AckOpen).writeString(id).commit();
      this.onOpenChannelEmitter.fire({ id, channel });
    }
    else {
      console.error(`channel already open: ${id}`);
    }
  }

  protected handleClose(id: string): void {
    const channel = this.openChannels.get(id);
    if (channel) {
      channel.onCloseEmitter.fire({ reason: "Channel has been closed from the remote side" });
      this.openChannels.delete(id);
    }
  }

  protected handleData(id: string, data: ReadBuffer): void {
    const channel = this.openChannels.get(id);
    if (channel) {
      channel.onMessageEmitter.fire(() => data.sliceAtReadPosition());
    }
  }

  protected createChannel(id: string): ForwardingChannel {
    return new ForwardingChannel(id, () => this.closeChannel(id), () => this.prepareWriteBuffer(id));
  }

  protected prepareWriteBuffer(id: string): WriteBuffer {
    const underlying = this.underlyingChannel.getWriteBuffer();
    underlying.writeUint8(MessageTypes.Data);
    underlying.writeString(id);
    return underlying;
  }

  protected closeChannel(id: string): void {
    this.underlyingChannel.getWriteBuffer()
      .writeUint8(MessageTypes.Close)
      .writeString(id)
      .commit();
    this.openChannels.delete(id);
  }

  open(id: string): Promise<Channel> {
    const existing = this.openChannels.get(id);
    if (existing) {
      return Promise.resolve(existing);
    }
    return new Promise<Channel>((resolve, reject) => {
      const listeners = this.pendingOpen.get(id);
      if (listeners) {
        listeners.push({ resolve, reject });
      }
      else {
        this.pendingOpen.set(id, [{ resolve, reject }]);
        this.underlyingChannel.getWriteBuffer().writeUint8(MessageTypes.Open).writeString(id).commit();
      }
    });
  }

  getOpenChannel(id: string): Channel | undefined {
    return this.openChannels.get(id);
  }

  dispose(): void {
    this.toDispose.dispose();
  }
}
