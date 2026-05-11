import type { Event } from "@core/base/event";

import type { IChannel, IServerChannel } from "./ipc.ts";

export function createServerChannel(service: any): IServerChannel {
  return {
    call<T>(command: string, arg?: any): Promise<T> {
      const fn = service[command];
      if (typeof fn !== "function") {
        return Promise.reject(new Error(`Method ${command} not found on service`));
      }
      return Promise.resolve(fn.call(service, arg));
    },
    listen<T>(event: string, arg?: any): Event<T> {
      const fn = service[event];
      if (typeof fn !== "function") {
        return (_listener, _thisArgs, disposables) => {
          const d = { dispose() { } };
          if (disposables) {
            disposables.push(d);
          }
          return d;
        };
      }
      return fn.call(service, arg);
    },
  };
}

export function createChannelProxy<T>(channel: IChannel, methods: string[]): T {
  const proxy: any = {};
  for (const method of methods) {
    if (method.startsWith("on")) {
      proxy[method] = (arg?: any) => channel.listen(method, arg);
    }
    else {
      proxy[method] = (arg?: any) => channel.call(method, arg);
    }
  }
  return proxy as T;
}
