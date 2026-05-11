/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { dialog, shell } from "electron";
import { Disposable } from "@core/base/lifecycle";
import { createDecorator } from "@core/di/instantiation";

export interface INativeHostMainService {
  readonly _serviceBrand: undefined;
  openExternal: (url: string) => Promise<void>;
  showMessageBox: (options: any) => Promise<any>;
}

export const INativeHostMainService = createDecorator<INativeHostMainService>("native-host-main-service");

export class NativeHostMainService extends Disposable implements INativeHostMainService {
  declare readonly _serviceBrand: undefined;

  async openExternal(url: string): Promise<void> {
    await shell.openExternal(url);
  }

  async showMessageBox(options: any): Promise<any> {
    return dialog.showMessageBox(options);
  }
}
