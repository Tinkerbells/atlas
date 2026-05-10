/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { IChannel, IChannelClient } from "@/core/ipc/ipc";

import { Disposable } from "@/core/base/lifecycle";
import { ChannelClient } from "@/core/ipc/ipc-client";
import { MessagePortProtocol } from "@/core/ipc/common/ipc.mp";

export class MessagePortClient extends Disposable implements IChannelClient {
  private readonly _client: ChannelClient;

  constructor(port: MessagePort) {
    super();
    const protocol = new MessagePortProtocol(port);
    this._client = new ChannelClient(protocol);
  }

  getChannel<T extends IChannel>(channelName: string): T {
    return this._client.getChannel(channelName);
  }

  override dispose(): void {
    this._client.dispose();
    super.dispose();
  }
}
