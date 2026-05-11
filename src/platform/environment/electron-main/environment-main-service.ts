/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { App } from "electron";

import { createDecorator } from "@core/di/instantiation";

export interface IEnvironmentMainService {
  readonly _serviceBrand: undefined;
  readonly appRoot: string;
  readonly userDataPath: string;
  readonly logsHome: string;
  readonly app: App;
}

export const IEnvironmentMainService = createDecorator<IEnvironmentMainService>("environment-main-service");
