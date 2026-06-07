import type { WebContents } from "electron";

import { ipcMain } from "electron";

import type { IDisposable } from "../../common/lifecycle";
import type { WriteBuffer } from "../../common/messaging/buffer";

import { Emitter } from "../../common/event";
import { DisposableStore } from "../../common/lifecycle";
import { AbstractChannel, ChannelMultiplexer } from "../../common/messaging/channel";
import { Uint8ArrayReadBuffer, Uint8ArrayWriteBuffer } from "../../common/messaging/buffer";

export class ElectronMainChannel extends AbstractChannel {
  private _disposables = new DisposableStore();

  constructor(private readonly webContents: WebContents) {
    super();
    const handler = (_event: Electron.IpcMainEvent, data: Uint8Array) => {
      this.onMessageEmitter.fire(() => new Uint8ArrayReadBuffer(data));
    };
    ipcMain.on("atlas:rpc", handler);
    this._disposables.add({
      dispose: () => {
        ipcMain.removeListener("atlas:rpc", handler);
      },
    });
  }

  getWriteBuffer(): WriteBuffer {
    const writer = new Uint8ArrayWriteBuffer();
    writer.onCommit((buffer) => {
      if (!this.webContents.isDestroyed()) {
        this.webContents.send("atlas:rpc", buffer);
      }
    });
    return writer;
  }

  override close(): void {
    super.close();
    this._disposables.dispose();
  }
}

export class ElectronMainRpcConnection implements IDisposable {
  private readonly _disposables = new DisposableStore();
  public readonly multiplexer: ChannelMultiplexer;

  constructor(webContents: WebContents) {
    const channel = new ElectronMainChannel(webContents);
    this.multiplexer = new ChannelMultiplexer(channel);
    this._disposables.add(this.multiplexer);
  }

  dispose(): void {
    this._disposables.dispose();
  }
}

export class ElectronMainRpcRegistry {
  private connections = new Map<number, ElectronMainRpcConnection>();
  private readonly onDidCreateConnectionEmitter = new Emitter<ElectronMainRpcConnection>();
  readonly onDidCreateConnection = this.onDidCreateConnectionEmitter.event;

  createConnection(webContents: WebContents): ElectronMainRpcConnection {
    const id = webContents.id;
    if (this.connections.has(id)) {
      return this.connections.get(id)!;
    }
    const connection = new ElectronMainRpcConnection(webContents);
    this.connections.set(id, connection);
    webContents.on("destroyed", () => {
      this.connections.delete(id);
      connection.dispose();
    });
    this.onDidCreateConnectionEmitter.fire(connection);
    return connection;
  }

  getConnection(webContents: WebContents): ElectronMainRpcConnection | undefined {
    return this.connections.get(webContents.id);
  }
}

export const mainRpcRegistry = new ElectronMainRpcRegistry();
