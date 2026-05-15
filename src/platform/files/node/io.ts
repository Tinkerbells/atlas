/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's io.ts for Atlas.

import type { URI } from "@platform/common/uri/uri";
import type { CancellationToken } from "@core/base/cancellation";
import type { IDataTransformer, IErrorTransformer, WriteableStream } from "@core/base/stream";

import { VSBuffer } from "@core/base/buffer";
import { CancellationError } from "@core/base/errors";

import type { IFileReadStreamOptions, IFileSystemProviderWithOpenReadWriteCloseCapability } from "../common/files";

import {
  createFileSystemProviderError,
  ensureFileSystemProviderError,
  FileSystemProviderErrorCode,

} from "../common/files";

export interface ICreateReadStreamOptions extends IFileReadStreamOptions {
  /**
   * The size of the buffer to use before sending to the stream.
   */
  readonly bufferSize: number;

  /**
   * Allows to massage any possibly error that happens during reading.
   */
  readonly errorTransformer?: IErrorTransformer;
}

/**
 * A helper to read a file from a provider with open/read/close capability into a stream.
 */
export async function readFileIntoStream<T>(
  provider: IFileSystemProviderWithOpenReadWriteCloseCapability,
  resource: URI,
  target: WriteableStream<T>,
  transformer: IDataTransformer<VSBuffer, T>,
  options: ICreateReadStreamOptions,
  token: CancellationToken,
): Promise<void> {
  let error: Error | undefined;

  try {
    await doReadFileIntoStream(provider, resource, target, transformer, options, token);
  }
  catch (err) {
    error = err as Error;
  }
  finally {
    if (error && options.errorTransformer) {
      error = options.errorTransformer(error);
    }

    if (typeof error !== "undefined") {
      target.error(error);
    }

    target.end();
  }
}

async function doReadFileIntoStream<T>(
  provider: IFileSystemProviderWithOpenReadWriteCloseCapability,
  resource: URI,
  target: WriteableStream<T>,
  transformer: IDataTransformer<VSBuffer, T>,
  options: ICreateReadStreamOptions,
  token: CancellationToken,
): Promise<void> {
  // Check for cancellation
  throwIfCancelled(token);

  // open handle through provider
  const handle = await provider.open(resource, { create: false });

  try {
    // Check for cancellation
    throwIfCancelled(token);

    let totalBytesRead = 0;
    let bytesRead = 0;
    let allowedRemainingBytes = (options && typeof options.length === "number") ? options.length : undefined;

    let buffer = VSBuffer.alloc(Math.min(options.bufferSize, typeof allowedRemainingBytes === "number" ? allowedRemainingBytes : options.bufferSize));

    let posInFile = options && typeof options.position === "number" ? options.position : 0;
    let posInBuffer = 0;
    do {
      // read from source (handle) at current position (pos) into buffer (buffer) at
      // buffer position (posInBuffer) up to the size of the buffer (buffer.byteLength).
      bytesRead = await provider.read(handle, posInFile, buffer.buffer, posInBuffer, buffer.byteLength - posInBuffer);

      posInFile += bytesRead;
      posInBuffer += bytesRead;
      totalBytesRead += bytesRead;

      if (typeof allowedRemainingBytes === "number") {
        allowedRemainingBytes -= bytesRead;
      }

      // when buffer full, create a new one and emit it through stream
      if (posInBuffer === buffer.byteLength) {
        await target.write(transformer(buffer));

        buffer = VSBuffer.alloc(Math.min(options.bufferSize, typeof allowedRemainingBytes === "number" ? allowedRemainingBytes : options.bufferSize));

        posInBuffer = 0;
      }
    } while (bytesRead > 0 && (typeof allowedRemainingBytes !== "number" || allowedRemainingBytes > 0) && throwIfCancelled(token) && throwIfTooLarge(totalBytesRead, options));

    // wrap up with last buffer (also respect maxBytes if provided)
    if (posInBuffer > 0) {
      let lastChunkLength = posInBuffer;
      if (typeof allowedRemainingBytes === "number") {
        lastChunkLength = Math.min(posInBuffer, allowedRemainingBytes);
      }

      target.write(transformer(buffer.slice(0, lastChunkLength)));
    }
  }
  catch (error) {
    throw ensureFileSystemProviderError(error);
  }
  finally {
    await provider.close(handle);
  }
}

function throwIfCancelled(token: CancellationToken): boolean {
  if (token.isCancellationRequested) {
    throw new CancellationError();
  }

  return true;
}

function throwIfTooLarge(totalBytesRead: number, options: ICreateReadStreamOptions): boolean {
  // Return early if file is too large to load and we have configured limits
  if (typeof options?.limits?.size === "number" && totalBytesRead > options.limits.size) {
    throw createFileSystemProviderError("File is too large to open", FileSystemProviderErrorCode.FileTooLarge);
  }

  return true;
}
