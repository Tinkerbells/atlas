import { ipcMain } from "electron";

import type { IMainEvents, IMainQueries } from "~/common/bridge/api-contract";

import { createDecorator, InstantiationType, registerSingleton } from "~/common/di";

import { IWindowManager } from "../windows";

export interface IBridgeRouter {
  readonly _serviceBrand: undefined;

  register: <K extends keyof IMainQueries>(
    channel: K,
    handler: (...args: any[]) => any,
  ) => void;

  send: <K extends keyof IMainEvents>(
    channel: K,
    ...args: any[]
  ) => void;
}

export const IBridgeRouter = createDecorator<IBridgeRouter>("bridgeRouter");

export class BridgeRouter implements IBridgeRouter {
  readonly _serviceBrand: undefined;

  constructor(
    @IWindowManager private readonly windowManager: IWindowManager,
  ) { }

  register<K extends keyof IMainQueries>(
    channel: K,
    handler: (...args: any[]) => any,
  ): void {
    ipcMain.handle(channel, async (_event, ...args: any[]) => {
      return await handler(...args);
    });
  }

  send<K extends keyof IMainEvents>(
    channel: K,
    ...args: any[]
  ): void {
    for (const window of this.windowManager.getAllWindows()) {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, ...args);
      }
    }
  }
}

registerSingleton(IBridgeRouter, BridgeRouter, InstantiationType.Eager);
