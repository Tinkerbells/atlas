import type { Event } from "@/core/base/event";

export interface IMessagePassingProtocol {
  send: (message: any) => void;
  readonly onMessage: Event<any>;
}

export interface IChannel {
  call: <T>(command: string, arg?: any) => Promise<T>;
  listen: <T>(event: string, arg?: any) => Event<T>;
}

export interface IServerChannel {
  call: <T>(command: string, arg?: any) => Promise<T>;
  listen: <T>(event: string, arg?: any) => Event<T>;
}

export interface IChannelClient {
  getChannel: <T extends IChannel>(channelName: string) => T;
}

export interface IChannelServer {
  registerChannel: (channelName: string, channel: IServerChannel) => void;
}
