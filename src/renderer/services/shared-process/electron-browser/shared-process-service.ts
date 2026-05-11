/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { IChannel, IChannelClient } from "@core/ipc/ipc";

import { Disposable } from "@core/base/lifecycle";
import { MessagePortClient } from "@core/ipc/electron-browser/ipc.mp";

export class SharedProcessService extends Disposable implements IChannelClient {
  private _client: MessagePortClient | undefined;
  private _whenReady: Promise<void>;

  constructor() {
    super();
    this._whenReady = this._acquirePort();
  }

  private async _acquirePort(): Promise<void> {
    return new Promise((resolve, reject) => {
      const nonce = Math.random().toString(36).substring(2);

      const handler = (event: MessageEvent) => {
        if (event.data?.type === "app:sharedProcessPort" && event.data?.nonce === nonce) {
          window.removeEventListener("message", handler);
          const port = event.ports[0];
          if (!port) {
            reject(new Error("No MessagePort received"));
            return;
          }
          this._client = new MessagePortClient(port);
          resolve();
        }
      };

      window.addEventListener("message", handler);
      (window as any).app.ipcSend("app:requestSharedProcessPort", nonce);

      setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error("Timeout acquiring MessagePort for shared process"));
      }, 10000);
    });
  }

  // @ts-expect-error — async channel acquisition does not match IChannelClient sync signature yet
  async getChannel<T extends IChannel>(channelName: string): Promise<T> {
    await this._whenReady;
    if (!this._client) {
      throw new Error("Shared process client not initialized");
    }
    // @ts-expect-error — IChannel is not assignable to generic T
    return this._client.getChannel(channelName);
  }

  override dispose(): void {
    this._client?.dispose();
    super.dispose();
  }
}
