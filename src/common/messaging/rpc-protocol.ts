import type { Channel } from "./channel";
import type { Event, IDisposable } from "../event";
import type { ReadBuffer, WriteBuffer } from "./buffer";

import { decode, encode } from "./msgpack";
import { DisposableStore } from "../lifecycle";
import { Uint8ArrayWriteBuffer } from "./buffer";

export const enum MessageType {
  Request = 1,
  Notification = 2,
  Reply = 3,
  ReplyErr = 4,
}

let requestId = 0;
function getNextRequestId(): number {
  return ++requestId;
}

export class RpcProtocolImpl implements IDisposable {
  private pendingRequests = new Map<number, { resolve: (value: unknown) => void; reject: (err: Error) => void }>();
  private target?: Record<string, (...args: unknown[]) => unknown>;
  private readonly toDispose = new DisposableStore();

  constructor(private readonly channel: Channel) {
    this.toDispose.add(channel.onMessage(msg => this.handleMessage(msg())));
    this.toDispose.add(channel.onClose(() => this.dispose()));
    this.toDispose.add(channel.onError(err => this.handleError(err)));
  }

  setTarget(target: unknown): void {
    this.target = target;
  }

  private handleError(error: unknown): void {
    this.pendingRequests.forEach(({ reject }) => {
      reject(error instanceof Error ? error : new Error(String(error)));
    });
    this.pendingRequests.clear();
  }

  private handleMessage(buffer: ReadBuffer): void {
    const type = buffer.readUint8();
    if (type === MessageType.Request) {
      const requestId = buffer.readUint32();
      const method = buffer.readString();
      const args = decode<unknown[]>(buffer.readBytes());
      this.handleRequest(requestId, method, args);
    }
    else if (type === MessageType.Notification) {
      const method = buffer.readString();
      const args = decode<unknown[]>(buffer.readBytes());
      this.handleNotification(method, args);
    }
    else if (type === MessageType.Reply) {
      const requestId = buffer.readUint32();
      const payload = buffer.readBytes();
      const pending = this.pendingRequests.get(requestId);
      if (pending) {
        this.pendingRequests.delete(requestId);
        pending.resolve(decode(payload));
      }
    }
    else if (type === MessageType.ReplyErr) {
      const requestId = buffer.readUint32();
      const payload = buffer.readBytes();
      const pending = this.pendingRequests.get(requestId);
      if (pending) {
        this.pendingRequests.delete(requestId);
        pending.reject(decode<Error>(payload));
      }
    }
  }

  private async handleRequest(requestId: number, method: string, args: unknown[]): Promise<void> {
    try {
      const target = this.target;
      if (!target) {
        throw new Error(`No target registered for RPC`);
      }
      const handler = target[method];
      if (typeof handler !== "function") {
        throw new TypeError(`Method ${method} not found on target`);
      }
      const result = await handler.apply(target, args);
      this.sendReply(requestId, result);
    }
    catch (err) {
      this.sendReplyErr(requestId, err);
    }
  }

  private handleNotification(method: string, args: unknown[]): void {
    try {
      const target = this.target;
      if (!target) {
        return;
      }
      const handler = target[method];
      if (typeof handler === "function") {
        handler.apply(target, args);
      }
    }
    catch (err) {
      console.error(`Notification error for ${method}:`, err);
    }
  }

  private sendReply(requestId: number, result: unknown): void {
    const writer = this.channel.getWriteBuffer();
    writer.writeUint8(MessageType.Reply);
    writer.writeUint32(requestId);
    writer.writeBytes(encode(result));
    writer.commit();
  }

  private sendReplyErr(requestId: number, err: unknown): void {
    const writer = this.channel.getWriteBuffer();
    writer.writeUint8(MessageType.ReplyErr);
    writer.writeUint32(requestId);
    writer.writeBytes(encode(err));
    writer.commit();
  }

  sendRequest(method: string, args: unknown[]): Promise<unknown> {
    const id = getNextRequestId();
    const writer = this.channel.getWriteBuffer();
    writer.writeUint8(MessageType.Request);
    writer.writeUint32(id);
    writer.writeString(method);
    writer.writeBytes(encode(args));
    writer.commit();
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
    });
  }

  sendNotification(method: string, args: unknown[]): void {
    const writer = this.channel.getWriteBuffer();
    writer.writeUint8(MessageType.Notification);
    writer.writeString(method);
    writer.writeBytes(encode(args));
    writer.commit();
  }

  dispose(): void {
    this.toDispose.dispose();
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error("RPC connection closed"));
    });
    this.pendingRequests.clear();
  }
}

export class RpcProxyFactory<T extends object> {
  constructor(private readonly protocol: RpcProtocolImpl) {}

  createProxy(): T {
    const protocol = this.protocol;
    return new Proxy({} as T, {
      get(_target, prop) {
        if (typeof prop !== "string") {
          return undefined;
        }
        if (prop === "then" || prop === "catch" || prop === "finally" || prop === "toString" || prop === "dispose") {
          return undefined;
        }
        return (...args: unknown[]) => protocol.sendRequest(prop, args);
      },
    });
  }

  createNotifyProxy(): T {
    const protocol = this.protocol;
    return new Proxy({} as T, {
      get(_target, prop) {
        if (typeof prop !== "string") {
          return undefined;
        }
        if (prop === "then" || prop === "catch" || prop === "finally" || prop === "toString" || prop === "dispose") {
          return undefined;
        }
        return (...args: unknown[]) => protocol.sendNotification(prop, args);
      },
    });
  }
}

export class BatchingChannel implements Channel {
  private messagesToSend: Uint8Array[] = [];
  private flushScheduled = false;

  constructor(private readonly underlying: Channel) {}

  get onClose(): Event<{ reason: string; code?: number }> {
    return this.underlying.onClose;
  }

  get onError(): Event<unknown> {
    return this.underlying.onError;
  }

  get onMessage(): Event<() => ReadBuffer> {
    return this.underlying.onMessage;
  }

  getWriteBuffer(): WriteBuffer {
    const writer = new Uint8ArrayWriteBuffer();
    writer.onCommit(buffer => this.commitSingleMessage(buffer));
    return writer;
  }

  private commitSingleMessage(msg: Uint8Array): void {
    if (this.messagesToSend.length === 0) {
      this.flushScheduled = true;
      queueMicrotask(() => this.sendAccumulated());
    }
    this.messagesToSend.push(msg);
  }

  private sendAccumulated(): void {
    if (!this.flushScheduled)
      return;
    this.flushScheduled = false;
    const cachedMessages = this.messagesToSend;
    this.messagesToSend = [];
    const underlyingWriter = this.underlying.getWriteBuffer();
    underlyingWriter.writeLength(cachedMessages.length);
    for (const msg of cachedMessages) {
      underlyingWriter.writeBytes(msg);
    }
    underlyingWriter.commit();
  }

  close(): void {
    this.sendAccumulated();
    this.underlying.close();
  }
}
