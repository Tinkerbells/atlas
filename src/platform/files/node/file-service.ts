/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { URI } from "@platform/common/uri/uri";

import { dirname } from "node:path";
import { promises as fs } from "node:fs";

import type { IFileService } from "../common/files";

import { FileOperationError, FileOperationResult } from "../common/files";

export class FileService implements IFileService {
  declare readonly _serviceBrand: undefined;

  async readFile(resource: URI): Promise<string> {
    try {
      return await fs.readFile(resource.fsPath, "utf-8");
    }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        throw new FileOperationError(`File not found: ${resource.fsPath}`, FileOperationResult.FILE_NOT_FOUND);
      }
      throw e;
    }
  }

  async writeFile(resource: URI, content: string): Promise<void> {
    await fs.mkdir(dirname(resource.fsPath), { recursive: true });
    await fs.writeFile(resource.fsPath, content, "utf-8");
  }

  async exists(resource: URI): Promise<boolean> {
    try {
      await fs.access(resource.fsPath);
      return true;
    }
    catch {
      return false;
    }
  }
}
