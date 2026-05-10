import type { MessagePortMain, WebContents } from "electron";

import { ipcMain } from "electron";

import type { IDisposable } from "@/core/base/lifecycle";
import type { IChannelServer, IServerChannel } from "@/core/ipc/ipc";

import { Emitter } from "@/core/base/event";
import { ChannelServer } from "@/core/ipc/ipc-server";
import { Disposable, toDisposable } from "@/core/base/lifecycle";

class ElectronServerProtocol implements IDisposable {
  private _onMessage = new Emitter<any>();
  readonly onMessage = this._onMessage.event;
  private readonly disposables: IDisposable[] = [];

  constructor(private readonly webContents: WebContents) {
    const handler = (event: any, request: any) => {
      if (event.sender === webContents) {
        this._onMessage.fire(request);
      }
    };
    ipcMain.on("app:message", handler);
    this.disposables.push(toDisposable(() => ipcMain.removeListener("app:message", handler)));
  }

  send(message: any): void {
    if (!this.webContents.isDestroyed()) {
      this.webContents.send("app:message", message);
    }
  }

  dispose(): void {
    this._onMessage.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}

export class ElectronIPCServer extends Disposable implements IChannelServer {
  private readonly _servers = new Map<number, ChannelServer>();
  private readonly _pendingChannels = new Map<string, IServerChannel>();

  constructor() {
    super();

    const handler = (_event: Electron.IpcMainEvent) => {
      const webContents = _event.sender;
      this._onHello(webContents);
    };

    ipcMain.on("app:hello", handler);
    this._register(toDisposable(() => ipcMain.removeListener("app:hello", handler)));
  }

  private _onHello(webContents: WebContents): void {
    if (this._servers.has(webContents.id)) {
      return;
    }

    const protocol = new ElectronServerProtocol(webContents);
    const server = new ChannelServer(protocol);

    // Register all pending channels on the new server
    for (const [name, channel] of this._pendingChannels) {
      server.registerChannel(name, channel);
    }

    this._servers.set(webContents.id, server);

    const onDestroyed = () => {
      this._servers.delete(webContents.id);
      server.dispose();
      protocol.dispose();
    };

    webContents.once("destroyed", onDestroyed);
    (webContents as any).once("crashed", onDestroyed);
  }

  registerChannel(channelName: string, channel: IServerChannel): void {
    this._pendingChannels.set(channelName, channel);
    for (const server of this._servers.values()) {
      server.registerChannel(channelName, channel);
    }
  }

  async createMessageChannel(webContents: WebContents): Promise<MessagePortMain> {
    return new Promise((resolve, reject) => {
      const nonce = Math.random().toString(36).substring(2);

      const handler = (event: Electron.IpcMainEvent, data: string) => {
        if (data === nonce) {
          ipcMain.removeListener("app:messageChannelResult", handler);
          const port = event.ports[0];
          if (!port) {
            reject(new Error("No MessagePort received from renderer"));
            return;
          }
          port.start();
          resolve(port);
        }
      };

      ipcMain.on("app:messageChannelResult", handler);
      webContents.send("app:createMessageChannel", nonce);

      setTimeout(() => {
        ipcMain.removeListener("app:messageChannelResult", handler);
        reject(new Error("Timeout waiting for MessagePort"));
      }, 10000);
    });
  }

  dispose(): void {
    for (const server of this._servers.values()) {
      server.dispose();
    }
    this._servers.clear();
    super.dispose();
  }
}
