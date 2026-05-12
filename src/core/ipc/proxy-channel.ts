import type { Event } from "@core/base/event";
import type { IChannel, IServerChannel } from "@core/ipc/ipc";

export class ProxyChannel {
  static fromService(service: any): IServerChannel {
    const mapEventNameToEvent = new Map<string, Event<any>>();

    for (const key of Object.keys(service)) {
      if (key.startsWith("on") && key.length > 2 && key[2] === key[2].toUpperCase()) {
        const event = service[key];
        if (typeof event === "function") {
          mapEventNameToEvent.set(key, event.bind(service));
        }
      }
    }

    return {
      call: async (_command: string, arg?: any) => {
        const method = service[_command];
        if (typeof method !== "function") {
          throw new TypeError(`Method not found: ${_command}`);
        }
        return method.call(service, ...(Array.isArray(arg) ? arg : [arg]));
      },
      listen: (_event: string, _arg?: any) => {
        const event = mapEventNameToEvent.get(_event);
        if (!event) {
          throw new Error(`Event not found: ${_event}`);
        }
        return event;
      },
    };
  }

  static toService<T>(channel: IChannel): T {
    return new Proxy(Object.create(null), {
      get(_target: T, propKey: PropertyKey) {
        if (typeof propKey !== "string") {
          return undefined;
        }

        if (propKey.startsWith("on") && propKey.length > 2 && propKey[2] === propKey[2].toUpperCase()) {
          return channel.listen(propKey);
        }

        return async (...args: any[]) => {
          return channel.call(propKey, args);
        };
      },
    }) as T;
  }
}
