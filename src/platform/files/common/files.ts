/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { URI } from "@platform/common/uri/uri";

import { createDecorator } from "@core/di/instantiation";

export const IFileService = createDecorator<IFileService>("fileService");

export interface IFileService {
  readonly _serviceBrand: undefined;
  readFile: (resource: URI) => Promise<string>;
  writeFile: (resource: URI, content: string) => Promise<void>;
  exists: (resource: URI) => Promise<boolean>;
}

export const enum FileOperationResult {
  FILE_IS_BINARY = 0,
  FILE_IS_DIRECTORY = 1,
  FILE_NOT_FOUND = 2,
  FILE_NOT_MODIFIED_SINCE = 3,
  FILE_MODIFIED_SINCE = 4,
  FILE_MOVE_CONFLICT = 5,
  FILE_READ_ONLY = 6,
  FILE_TOO_LARGE = 7,
  FILE_INVALID_PATH = 8,
  FILE_EXCEEDS_MEMORY_LIMIT = 9,
  FILE_OTHER_ERROR = 10,
}

export class FileOperationError extends Error {
  constructor(message: string, public fileOperationResult: FileOperationResult) {
    super(message);
  }
}
