/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { createDecorator } from "@/core/di/instantiation";

export interface IProductService {
  readonly _serviceBrand: undefined;
  readonly nameShort: string;
  readonly nameLong: string;
  readonly version: string;
}

export const IProductService = createDecorator<IProductService>("product-service");
