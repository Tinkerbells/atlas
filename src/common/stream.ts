import { Emitter } from "./event";

/* eslint-disable ts/method-signature-style */
export interface ReadableStreamEvents<T> {
  on(event: "data", callback: (data: T) => void): this;
  on(event: "error", callback: (err: Error) => void): this;
  on(event: "end", callback: () => void): this;
  on(event: string | symbol, callback: Function): this;
}
/* eslint-enable ts/method-signature-style */

export interface WriteableStreamEvents<T> extends ReadableStreamEvents<T> {
  write: (data: T) => void;
  error: (error: Error) => void;
  end: (result?: Error) => void;
  destroyed: boolean;
}

interface WriteableStreamOptions {
  highWaterMark?: number;
}

export function newWriteableStream<T>(_reducer: (data: T[]) => T, options?: WriteableStreamOptions): WriteableStreamEvents<T> {
  const highWaterMark = options?.highWaterMark ?? 65536;
  const data: T[] = [];
  let dataLen = 0;
  let ended = false;
  let destroyed = false;

  const dataEmitter = new Emitter<T>();
  const errorEmitter = new Emitter<Error>();
  const endEmitter = new Emitter<void>();

  const stream: WriteableStreamEvents<T> = {
    on(event: string | symbol, callback: Function): WriteableStreamEvents<T> {
      switch (event) {
        case "data":
          dataEmitter.event(callback as (e: T) => void);
          break;
        case "error":
          errorEmitter.event(callback as (e: Error) => void);
          break;
        case "end":
          endEmitter.event(callback as () => void);
          break;
      }
      return stream;
    },
    write(chunk: T): void {
      if (destroyed) {
        return;
      }
      if (ended) {
        return;
      }
      data.push(chunk);
      dataLen += Array.isArray(chunk) ? chunk.length : 1; // simplistic length
      dataEmitter.fire(chunk);
      if (dataLen > highWaterMark) {
        // simplistic backpressure: no-op in this minimal version
      }
    },
    error(err: Error): void {
      if (destroyed || ended) {
        return;
      }
      errorEmitter.fire(err);
      destroyed = true;
      dataEmitter.dispose();
      errorEmitter.dispose();
      endEmitter.dispose();
    },
    end(err?: Error): void {
      if (destroyed || ended) {
        return;
      }
      ended = true;
      if (err) {
        errorEmitter.fire(err);
      }
      else {
        endEmitter.fire();
      }
      destroyed = true;
      dataEmitter.dispose();
      errorEmitter.dispose();
      endEmitter.dispose();
    },
    get destroyed() {
      return destroyed;
    },
  };

  return stream;
}
