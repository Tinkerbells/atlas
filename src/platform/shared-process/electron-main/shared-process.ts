/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { Event } from "@core/base/event";
import type { MessagePortMain, UtilityProcess, WebContents } from "electron";

import { Emitter } from "@core/base/event";
import { Disposable } from "@core/base/lifecycle";
import { MessageChannelMain, utilityProcess } from "electron";

export class SharedProcess extends Disposable {
  private readonly _onDidExit = this._register(new Emitter<number | null>());
  readonly onDidExit: Event<number | null> = this._onDidExit.event;

  private readonly _onDidError = this._register(new Emitter<Error>());
  readonly onDidError: Event<Error> = this._onDidError.event;

  private _process: UtilityProcess | undefined;
  private readonly _whenReady = new Promise<void>((resolve) => {
    this._resolveReady = resolve;
  });

  private _resolveReady!: () => void;

  constructor(
    private readonly entryPath: string,
    private readonly userDataPath: string,
  ) {
    super();
  }

  spawn(): void {
    if (this._process) {
      return;
    }

    this._process = utilityProcess.fork(this.entryPath, [this.userDataPath], {
      serviceName: "app-shared-process",
    });

    // utilityProcess stdout/stderr are Web ReadableStreams, not Node.js streams
    (this._process.stdout as any)?.pipeTo?.(new WritableStream({
      write(chunk) {
        process.stdout.write(`[shared-process stdout] ${new TextDecoder().decode(chunk)}`);
      },
    })).catch(() => {});

    (this._process.stderr as any)?.pipeTo?.(new WritableStream({
      write(chunk) {
        process.stderr.write(`[shared-process stderr] ${new TextDecoder().decode(chunk)}`);
      },
    })).catch(() => {});

    this._process.once("exit", (code) => {
      console.log(`[SharedProcess] utility process exited with code ${code}`);
      this._onDidExit.fire(code);
    });

    this._process.once("spawn", () => {
      console.log("[SharedProcess] utility process spawned");
      this._resolveReady();
    });
  }

  async connect(): Promise<void> {
    await this._whenReady;
    console.log("[SharedProcess] connect() called after spawn");

    if (!this._process) {
      throw new Error("Shared process is not spawned");
    }

    // VS Code pattern: create MessageChannelMain and transfer port to shared process
    const { port1, port2 } = new MessageChannelMain();
    console.log("[SharedProcess] Created initial MessageChannelMain");

    // Transfer port2 to shared process via parentPort
    this._process.postMessage("app:init", [port2]);
    console.log("[SharedProcess] Sent port2 to shared process via postMessage(transfer)");

    // Keep port1 alive (not used for IPC in initial connection, but prevents GC)
    port1.on("message", (event) => {
      console.log("[SharedProcess] port1 (init) message:", JSON.stringify(event.data));
    });
    port1.start();
  }

  async createConnection(_webContents: WebContents): Promise<MessagePortMain> {
    console.log("[SharedProcess] createConnection() called");
    if (!this._process) {
      throw new Error("Shared process is not spawned");
    }

    // VS Code pattern: create new MessageChannelMain for each renderer connection
    const { port1, port2 } = new MessageChannelMain();
    console.log("[SharedProcess] Created new MessageChannelMain for renderer");
    console.log("[SharedProcess] port1 (to renderer):", !!port1, "port2 (to shared):", !!port2);

    // Transfer port2 to shared process via parentPort
    // VS Code: this.postMessage(payload, [utilityProcessPort])
    this._process.postMessage("app:newConnection", [port2]);
    console.log("[SharedProcess] Sent port2 to shared process via postMessage(transfer)");

    // Return port1 — will be sent to renderer via webContents.postMessage
    port1.start();
    return port1;
  }

  kill(): boolean {
    if (!this._process) {
      return false;
    }

    this._process.kill();
    this._process = undefined;
    return true;
  }

  override dispose(): void {
    this.kill();
    super.dispose();
  }
}
