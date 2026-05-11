/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { IMessagePassingProtocol } from "@core/ipc/ipc";

import { Emitter } from "@core/base/event";
import { ChannelServer } from "@core/ipc/ipc-server";

// In Electron utility process, parentPort is available as a global
const parentPort = (globalThis as any).parentPort || (process as any).parentPort;

class SharedProcessProtocol implements IMessagePassingProtocol {
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

if (!parentPort) {
  console.error("[shared-process] parentPort is not available");
  process.exit(1);
}

parentPort.on("message", (event: any) => {
  const ports = event.ports as MessagePort[];
  if (!ports || ports.length === 0) {
    console.error("[shared-process] No MessagePort received from main process");
    return;
  }

  const port = ports[0];
  const protocol = new SharedProcessProtocol(port);
  // eslint-disable-next-line no-new
  new ChannelServer(protocol);

  // TODO: Register shared process channels here
  // server.registerChannel("search", ...);
  // server.registerChannel("fileWatcher", ...);

  console.log("[shared-process] New connection established");
});

console.log("[shared-process] Started and ready");

// Keep the utility process alive
setInterval(() => { }, 1 << 30);
