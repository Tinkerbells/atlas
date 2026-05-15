/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's buffer implementation for Atlas.

import * as streams from "./stream";

interface NodeBuffer {
  allocUnsafe: (size: number) => Uint8Array;
  isBuffer: (obj: unknown) => obj is NodeBuffer;
  from: ((arrayBuffer: ArrayBufferLike, byteOffset?: number, length?: number) => Uint8Array) & ((data: string) => Uint8Array);
}

declare const Buffer: NodeBuffer;

const hasBuffer = (typeof Buffer !== "undefined");

let textEncoder: { encode: (input: string) => Uint8Array } | null;
let textDecoder: { decode: (input: Uint8Array) => string } | null;

export class VSBuffer {
  static alloc(byteLength: number): VSBuffer {
    if (hasBuffer) {
      return new VSBuffer(Buffer.allocUnsafe(byteLength));
    }
    else {
      return new VSBuffer(new Uint8Array(byteLength));
    }
  }

  static wrap(actual: Uint8Array): VSBuffer {
    if (hasBuffer && !(Buffer.isBuffer(actual))) {
      actual = Buffer.from(actual.buffer, actual.byteOffset, actual.byteLength);
    }
    return new VSBuffer(actual);
  }

  static fromString(source: string, options?: { dontUseNodeBuffer?: boolean }): VSBuffer {
    const dontUseNodeBuffer = options?.dontUseNodeBuffer || false;
    if (!dontUseNodeBuffer && hasBuffer) {
      return new VSBuffer(Buffer.from(source));
    }
    else {
      if (!textEncoder) {
        textEncoder = new TextEncoder();
      }
      return new VSBuffer(textEncoder.encode(source));
    }
  }

  static concat(buffers: VSBuffer[], totalLength?: number): VSBuffer {
    if (typeof totalLength === "undefined") {
      totalLength = 0;
      for (let i = 0, len = buffers.length; i < len; i++) {
        totalLength += buffers[i].byteLength;
      }
    }

    const ret = VSBuffer.alloc(totalLength);
    let offset = 0;
    for (let i = 0, len = buffers.length; i < len; i++) {
      const element = buffers[i];
      ret.set(element, offset);
      offset += element.byteLength;
    }

    return ret;
  }

  readonly buffer: Uint8Array;
  readonly byteLength: number;

  private constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.byteLength = this.buffer.byteLength;
  }

  clone(): VSBuffer {
    const result = VSBuffer.alloc(this.byteLength);
    result.set(this);
    return result;
  }

  toString(): string {
    if (hasBuffer) {
      return this.buffer.toString();
    }
    else {
      if (!textDecoder) {
        textDecoder = new TextDecoder(undefined, { ignoreBOM: true });
      }
      return textDecoder.decode(this.buffer);
    }
  }

  slice(start?: number, end?: number): VSBuffer {
    return new VSBuffer(this.buffer.subarray(start, end));
  }

  set(array: VSBuffer | Uint8Array | ArrayBuffer | ArrayBufferView, offset?: number): void {
    if (array instanceof VSBuffer) {
      this.buffer.set(array.buffer, offset);
    }
    else if (array instanceof Uint8Array) {
      this.buffer.set(array, offset);
    }
    else if (array instanceof ArrayBuffer) {
      this.buffer.set(new Uint8Array(array), offset);
    }
    else if (ArrayBuffer.isView(array)) {
      this.buffer.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength), offset);
    }
    else {
      throw new TypeError("Unknown argument 'array'");
    }
  }

  equals(other: VSBuffer): boolean {
    if (this === other) {
      return true;
    }

    if (this.byteLength !== other.byteLength) {
      return false;
    }

    return this.buffer.every((value, index) => value === other.buffer[index]);
  }
}

export interface VSBufferReadable extends streams.Readable<VSBuffer> { }

export interface VSBufferReadableStream extends streams.ReadableStream<VSBuffer> { }

export interface VSBufferWriteableStream extends streams.WriteableStream<VSBuffer> { }

export interface VSBufferReadableBufferedStream extends streams.ReadableBufferedStream<VSBuffer> { }

export function readableToBuffer(readable: VSBufferReadable): VSBuffer {
  return streams.consumeReadable<VSBuffer>(readable, chunks => VSBuffer.concat(chunks));
}

export function bufferToReadable(buffer: VSBuffer): VSBufferReadable {
  return streams.toReadable<VSBuffer>(buffer);
}

export function streamToBuffer(stream: streams.ReadableStream<VSBuffer>): Promise<VSBuffer> {
  return streams.consumeStream<VSBuffer>(stream, chunks => VSBuffer.concat(chunks));
}

export async function bufferedStreamToBuffer(bufferedStream: streams.ReadableBufferedStream<VSBuffer>): Promise<VSBuffer> {
  if (bufferedStream.ended) {
    return VSBuffer.concat(bufferedStream.buffer);
  }

  return VSBuffer.concat([
    ...bufferedStream.buffer,
    await streamToBuffer(bufferedStream.stream),
  ]);
}

export function bufferToStream(buffer: VSBuffer): streams.ReadableStream<VSBuffer> {
  return streams.toStream<VSBuffer>(buffer, chunks => VSBuffer.concat(chunks));
}

export function streamToBufferReadableStream(stream: streams.ReadableStreamEvents<Uint8Array | string>): streams.ReadableStream<VSBuffer> {
  return streams.transform<Uint8Array | string, VSBuffer>(stream, {
    data: data => typeof data === "string" ? VSBuffer.fromString(data) : VSBuffer.wrap(data),
  }, chunks => VSBuffer.concat(chunks));
}

export function newWriteableBufferStream(options?: streams.WriteableStreamOptions): streams.WriteableStream<VSBuffer> {
  return streams.newWriteableStream<VSBuffer>(chunks => VSBuffer.concat(chunks), options);
}
