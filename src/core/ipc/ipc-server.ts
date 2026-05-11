import type { IDisposable } from "@core/base/lifecycle";

import { dispose } from "@core/base/lifecycle";

import type { IChannelServer, IMessagePassingProtocol, IServerChannel } from "./ipc.ts";

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

export class ChannelServer implements IChannelServer, IDisposable {
  private channels = new Map<string, IServerChannel>();
  private activeRequests = new Map<number, IDisposable>();
  private protocolListener: IDisposable;

  constructor(private protocol: IMessagePassingProtocol) {
    this.protocolListener = this.protocol.onMessage(msg => this.onRawMessage(msg));
  }

  registerChannel(channelName: string, channel: IServerChannel): void {
    this.channels.set(channelName, channel);
  }

  private send(response: IRawResponse): void {
    this.protocol.send(response);
  }

  private onRawMessage(msg: any): void {
    const request = msg as IRawRequest;
    switch (request.type) {
      case "call":
        return this.onCall(request);
      case "listen":
        return this.onListen(request);
      case "dispose":
        return this.disposeActiveRequest(request.id);
    }
  }

  private onCall(request: IRawRequest): void {
    const channel = this.channels.get(request.channelName);
    if (!channel) {
      this.send({
        id: request.id,
        type: "error",
        error: { message: `Unknown channel: ${request.channelName}` },
      });
      return;
    }

    let promise: Promise<any>;
    try {
      promise = channel.call(request.name, request.arg);
    }
    catch (err) {
      promise = Promise.reject(err);
    }

    promise.then(
      data => this.send({ id: request.id, type: "reply", data }),
      err =>
        this.send({
          id: request.id,
          type: "error",
          error: err instanceof Error
            ? { message: err.message, stack: err.stack }
            : { message: String(err) },
        }),
    );
  }

  private onListen(request: IRawRequest): void {
    const channel = this.channels.get(request.channelName);
    if (!channel) {
      return;
    }

    const event = channel.listen(request.name, request.arg);
    const disposable = event((data) => {
      this.send({ id: request.id, type: "event", data });
    });

    this.activeRequests.set(request.id, disposable);
  }

  private disposeActiveRequest(id: number): void {
    const disposable = this.activeRequests.get(id);
    if (disposable) {
      disposable.dispose();
      this.activeRequests.delete(id);
    }
  }

  dispose(): void {
    this.protocolListener.dispose();
    dispose(this.activeRequests.values());
    this.activeRequests.clear();
    this.channels.clear();
  }
}
