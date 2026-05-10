/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { AppUpdater } from "electron-updater";

import { Disposable } from "@/core/base/lifecycle";
import { createDecorator } from "@/core/di/instantiation";

export interface IUpdateService {
  readonly _serviceBrand: undefined;
  checkForUpdates: () => void;
}

export const IUpdateService = createDecorator<IUpdateService>("update-service");

export class UpdateService extends Disposable implements IUpdateService {
  declare readonly _serviceBrand: undefined;
  private readonly _autoUpdater: AppUpdater;

  constructor() {
    super();

    // electron-updater does not provide a proper ESM export
    // eslint-disable-next-line ts/no-require-imports
    const electronUpdater = require("electron-updater");
    this._autoUpdater = electronUpdater.autoUpdater;

    this._autoUpdater.checkForUpdatesAndNotify().catch((error: Error) => {
      if (error.message.includes("No published versions")) {
        console.warn("No published versions found for auto-updater");
      }
      else {
        console.error("Auto-updater error:", error);
      }
    });
  }

  checkForUpdates(): void {
    this._autoUpdater.checkForUpdatesAndNotify().catch(console.error);
  }
}
