/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's uriIdentity.ts for Atlas.

import { createDecorator } from "@core/di/instantiation";

import type { URI } from "./uri";
import type { IExtUri } from "./resources";

import { extUriBiasedIgnorePathCase } from "./resources";

export const IUriIdentityService = createDecorator<IUriIdentityService>("uriIdentityService");

export interface IUriIdentityService {
  readonly _serviceBrand: undefined;
  readonly extUri: IExtUri;
  asCanonicalUri: (uri: URI) => URI;
}

export class UriIdentityService implements IUriIdentityService {
  declare readonly _serviceBrand: undefined;
  readonly extUri: IExtUri = extUriBiasedIgnorePathCase;

  asCanonicalUri(uri: URI): URI {
    // Normalize path, resolve . and .., apply case rules for platform
    return this.extUri.normalizePath(uri);
  }
}
