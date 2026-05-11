import type { IChannel } from "@core/ipc/ipc";
import type { INodeProcess, SpawnOptions, SpawnResult } from "@platform/node-process/common/node-process";

import { createChannelProxy } from "@core/ipc/channel";

export class NodeProcessChannelClient implements INodeProcess {
  declare readonly _serviceBrand: undefined;

  spawn: (options: SpawnOptions) => Promise<SpawnResult>;
  getBinary: (name: string) => Promise<string>;
  getHome: () => Promise<string>;

  constructor(channel: IChannel) {
    const proxy = createChannelProxy<INodeProcess>(channel, ["spawn", "getBinary", "getHome"]);
    this.spawn = proxy.spawn;
    this.getBinary = proxy.getBinary;
    this.getHome = proxy.getHome;
  }
}
