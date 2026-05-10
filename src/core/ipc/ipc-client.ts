import type { Event } from "@/core/base/event";
import type { IDisposable } from "@/core/base/lifecycle";

import { Emitter } from "@/core/base/event";
import { dispose, toDisposable } from "@/core/base/lifecycle";

import type { IChannel, IChannelClient, IMessagePassingProtocol } from "./ipc.ts";

interface IRawRequest {
  id: number;
  type: "call" | "listen" | "dispose";
  channelName: string;
  name: string;
  arg?: any;
}

interface IRawResponse {
  id: number;
  type: "reply" | "error" | "event";
  data?: any;
  error?: { message: string; stack?: string };
}

export class ChannelClient implements IChannelClient, IDisposable {
  private lastRequestId = 0;
  private readonly handlers = new Map<number, (response: IRawResponse) => void>();
  private readonly activeRequests = new Set<IDisposable>();
  private readonly protocolListener: IDisposable;

  constructor(private protocol: IMessagePassingProtocol) {
    this.protocolListener = this.protocol.onMessage(msg => this.onBuffer(msg));
  }

  getChannel<T extends IChannel>(channelName: string): T {
    const that = this;
    return {
      call(command: string, arg?: any): Promise<any> {
        return that.requestPromise(channelName, command, arg);
      },
      listen(event: string, arg?: any): Event<any> {
        return that.requestEvent(channelName, event, arg);
      },
    } as T;
  }

  private requestPromise(channelName: string, command: string, arg?: any): Promise<any> {
    const id = this.lastRequestId++;
    return new Promise((resolve, reject) => {
      this.handlers.set(id, (response) => {
        this.handlers.delete(id);
        if (response.type === "reply") {
          resolve(response.data);
        }
        else if (response.type === "error") {
          const err = new Error(response.error!.message);
          if (response.error!.stack) {
            err.stack = response.error!.stack;
          }
          reject(err);
        }
      });
      this.send({ id, type: "call", channelName, name: command, arg });
    });
  }

  private requestEvent(channelName: string, eventName: string, arg?: any): Event<any> {
    const id = this.lastRequestId++;
    let emitter: Emitter<any> | undefined;

    const listen = () => {
      this.handlers.set(id, (response) => {
        if (response.type === "event") {
          emitter?.fire(response.data);
        }
      });
      this.send({ id, type: "listen", channelName, name: eventName, arg });
    };

    const disposeListener = () => {
      this.handlers.delete(id);
      this.send({ id, type: "dispose", channelName: "", name: "", arg: undefined });
    };

    const that = this;
    const result: Event<any> = (listener, thisArgs, disposables) => {
      if (!emitter) {
        emitter = new Emitter<any>();
        listen();
      }
      const disposable = emitter.event(listener, thisArgs, disposables);
      const wrapper = toDisposable(() => {
        disposable.dispose();
        if (emitter && !emitter.hasListeners()) {
          emitter.dispose();
          emitter = undefined;
          disposeListener();
        }
      });
      that.activeRequests.add(wrapper);
      return wrapper;
    };

    return result;
  }

  private send(request: IRawRequest): void {
    this.protocol.send(request);
  }

  private onBuffer(msg: any): void {
    const response = msg as IRawResponse;
    const handler = this.handlers.get(response.id);
    handler?.(response);
  }

  dispose(): void {
    this.protocolListener.dispose();
    dispose(this.activeRequests);
    this.activeRequests.clear();
    this.handlers.clear();
  }
}
