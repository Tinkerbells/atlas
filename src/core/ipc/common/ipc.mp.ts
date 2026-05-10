/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { IMessagePassingProtocol } from "@/core/ipc/ipc";

import { Emitter } from "@/core/base/event";

export class MessagePortProtocol implements IMessagePassingProtocol {
  private _onMessage = new Emitter<any>();
  readonly onMessage = this._onMessage.event;

  constructor(private port: MessagePort) {
    port.onmessage = (event) => {
      this._onMessage.fire(event.data);
    };
    port.start();
  }

  send(message: any): void {
    this.port.postMessage(message);
  }
}
