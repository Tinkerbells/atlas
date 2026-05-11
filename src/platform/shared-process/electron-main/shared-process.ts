/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { Event } from "@core/base/event";
import type { MessagePortMain, UtilityProcess } from "electron";

import { Emitter } from "@core/base/event";
import { Disposable } from "@core/base/lifecycle";
import { MessageChannelMain, utilityProcess } from "electron";

export class SharedProcess extends Disposable {
  private readonly _onDidExit = this._register(new Emitter<number | null>());
  readonly onDidExit: Event<number | null> = this._onDidExit.event;

  private readonly _onDidError = this._register(new Emitter<Error>());
  readonly onDidError: Event<Error> = this._onDidError.event;

  private _process: UtilityProcess | undefined;
  private _mainPort: MessagePortMain | undefined;
  private readonly _whenReady = new Promise<void>((resolve) => {
    this._resolveReady = resolve;
  });

  private _resolveReady!: () => void;

  constructor(
    private readonly entryPath: string,
  ) {
    super();
  }

  spawn(): void {
    if (this._process) {
      return;
    }

    this._process = utilityProcess.fork(this.entryPath, [], {
      serviceName: "app-shared-process",
    });

    this._process.once("exit", (code) => {
      this._onDidExit.fire(code);
    });

    this._process.once("spawn", () => {
      this._resolveReady();
    });
  }

  async connect(): Promise<MessagePortMain> {
    await this._whenReady;

    if (!this._process) {
      throw new Error("Shared process is not spawned");
    }

    // Create initial message channel for main <-> shared process
    const { port1, port2 } = new MessageChannelMain();

    this._process.postMessage("app:init", [port1]);
    port2.start();

    this._mainPort = port2;
    return port2;
  }

  async createConnection(): Promise<MessagePortMain> {
    if (!this._mainPort) {
      throw new Error("Shared process not connected");
    }

    const { port1, port2 } = new MessageChannelMain();
    this._mainPort.postMessage("app:newConnection", [port1]);
    port2.start();

    return port2;
  }

  kill(): boolean {
    if (!this._process) {
      return false;
    }

    this._process.kill();
    this._process = undefined;
    this._mainPort = undefined;
    return true;
  }

  override dispose(): void {
    this.kill();
    super.dispose();
  }
}
