/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { BrowserWindow } from "electron";
import type { AppInitConfig } from "@main/app-init-config";

import { Disposable } from "@core/base/lifecycle";
import { createDecorator } from "@core/di/instantiation";

export interface IWindowsMainService {
  readonly _serviceBrand: undefined;
  openFirstWindow: () => Promise<BrowserWindow>;
  getLastActiveWindow: () => BrowserWindow | undefined;
}

export const IWindowsMainService = createDecorator<IWindowsMainService>("windows-main-service");

export class WindowsMainService extends Disposable implements IWindowsMainService {
  declare readonly _serviceBrand: undefined;

  private _window: BrowserWindow | undefined;

  constructor(
    private readonly initConfig: AppInitConfig,
  ) {
    super();
  }

  async openFirstWindow(): Promise<BrowserWindow> {
    const { BrowserWindow } = await import("electron");

    this._window = new BrowserWindow({
      width: 1200,
      height: 800,
      show: true,
      webPreferences: {
        preload: this.initConfig.preload.path,
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
      },
    });

    console.log(`[windows] BrowserWindow created, id=${this._window.id}, visible=${this._window.isVisible()}`);

    // Retry loading the renderer with backoff (dev server may not be ready yet)
    const window = this._window;
    const loadRenderer = async () => {
      if (this.initConfig.renderer instanceof URL) {
        await window.loadURL(this.initConfig.renderer.toString());
      }
      else {
        await window.loadFile(this.initConfig.renderer.path);
      }
    };

    let retries = 0;
    const maxRetries = 10;
    while (retries < maxRetries) {
      try {
        await loadRenderer();
        break;
      }
      catch (err: any) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(`Failed to load renderer after ${maxRetries} retries: ${err.message}`);
        }
        console.log(`[windows] Renderer load failed, retrying in 500ms... (${retries}/${maxRetries})`);
        await new Promise(r => setTimeout(r, 500));
      }
    }

    this._window.once("ready-to-show", () => {
      this._window?.show();
    });

    return this._window;
  }

  getLastActiveWindow(): BrowserWindow | undefined {
    return this._window;
  }
}
