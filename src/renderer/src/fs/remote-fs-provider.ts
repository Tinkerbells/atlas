import type { URI } from "~/common/fs/uri";
import type { ReadableStreamEvents } from "~/common/stream";
import type { CancellationToken } from "~/common/cancellation";
import type { FileReadStreamOptions, RemoteFileStreamError, RemoteFileSystemClient, RemoteFileSystemServer } from "~/common/fs/remote-fs-protocol";
import type { FileDeleteOptions, FileOpenOptions, FileOverwriteOptions, FileType, FileWriteOptions, IFileSystemProvider, Stat } from "~/common/fs/fs-provider";

import { Emitter } from "~/common/event";
import { newWriteableStream } from "~/common/stream";
import { FileSystemProviderCapabilities } from "~/common/fs/fs-provider";
import { RpcProtocolImpl, RpcProxyFactory } from "~/common/messaging/rpc-protocol";

import { rendererRpcConnection } from "../messaging/electron-renderer-rpc";

export class RemoteFileSystemProvider implements IFileSystemProvider {
  private _capabilities: FileSystemProviderCapabilities = FileSystemProviderCapabilities.ReadWrite;
  get capabilities(): FileSystemProviderCapabilities { return this._capabilities; }

  private server: RemoteFileSystemServer | undefined;
  private protocol: RpcProtocolImpl | undefined;
  private _ready: Promise<void>;

  private readonly onDidChangeFileEmitter = new Emitter<{ changes: { type: number; resource: string }[] }>();
  readonly onDidChangeFile = this.onDidChangeFileEmitter.event;

  private readonly onFileStreamDataEmitter = new Emitter<[number, Uint8Array]>();
  private readonly onFileStreamEndEmitter = new Emitter<[number, RemoteFileStreamError | undefined]>();
  private readonly onProgressEmitter = new Emitter<[number, number, number]>();

  private streamHandleSeq = 0;

  constructor() {
    this._ready = this._init();
  }

  get ready(): Promise<void> {
    return this._ready;
  }

  private async _init(): Promise<void> {
    const channel = await rendererRpcConnection.multiplexer.open("remote-filesystem");
    this.protocol = new RpcProtocolImpl(channel);

    const clientDispatcher: RemoteFileSystemClient = {
      notifyDidChangeFile: event => this.onDidChangeFileEmitter.fire(event),
      notifyFileWatchError: () => { },
      notifyDidChangeCapabilities: (caps) => { this._capabilities = caps; },
      onFileStreamData: (handle, data) => this.onFileStreamDataEmitter.fire([handle, data]),
      onFileStreamEnd: (handle, error) => this.onFileStreamEndEmitter.fire([handle, error]),
      onProgress: (handle, current, total) => this.onProgressEmitter.fire([handle, current, total]),
    };
    this.protocol.setTarget(clientDispatcher);

    this.server = new RpcProxyFactory<RemoteFileSystemServer>(this.protocol).createProxy();
    this._capabilities = await this.server.getCapabilities();
  }

  stat(resource: URI): Promise<Stat> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.stat(resource.toString()) as Promise<Stat>;
  }

  readdir(resource: URI): Promise<[string, FileType][]> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.readdir(resource.toString()) as Promise<[string, FileType][]>;
  }

  readFile(resource: URI): Promise<Uint8Array> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.readFile(resource.toString()) as Promise<Uint8Array>;
  }

  writeFile(resource: URI, content: Uint8Array, opts?: FileWriteOptions): Promise<void> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.writeFile(resource.toString(), content, opts ?? {}) as Promise<void>;
  }

  delete(resource: URI, options?: FileDeleteOptions): Promise<void> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.delete(resource.toString(), options ?? {}) as Promise<void>;
  }

  mkdir(resource: URI): Promise<void> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.mkdir(resource.toString()) as Promise<void>;
  }

  rename(from: URI, to: URI, options?: FileOverwriteOptions): Promise<void> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.rename(from.toString(), to.toString(), options ?? {}) as Promise<void>;
  }

  copy(from: URI, to: URI, options?: FileOverwriteOptions): Promise<void> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    const handle = this.streamHandleSeq++;
    return this.server.copy(from.toString(), to.toString(), options ?? {}, handle) as Promise<void>;
  }

  statfs(resource: URI): Promise<{ free: number; total: number }> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.statfs(resource.toString()) as Promise<{ free: number; total: number }>;
  }

  open(resource: URI, opts?: FileOpenOptions): Promise<number> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.open(resource.toString(), opts ?? {}) as Promise<number>;
  }

  close(fd: number): Promise<void> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.close(fd) as Promise<void>;
  }

  async read(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.read(fd, pos, length).then(({ bytes, bytesRead }) => {
      data.set(bytes.slice(0, bytesRead), offset);
      return bytesRead;
    });
  }

  write(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    return this.server.write(fd, pos, data, offset, length) as Promise<number>;
  }

  readFileStream(resource: URI, opts?: FileReadStreamOptions, token?: CancellationToken): ReadableStreamEvents<Uint8Array> {
    const stream = newWriteableStream<Uint8Array>((data) => {
      let totalLength = 0;
      for (const chunk of data) {
        totalLength += chunk.byteLength;
      }
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of data) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return result;
    });

    const streamHandle = this.streamHandleSeq++;

    const cancelListener = token?.onCancellationRequested(() => {
      stream.end(new Error("Cancelled"));
      cleanup();
    });

    const dataListener = this.onFileStreamDataEmitter.event(([handle, data]) => {
      if (streamHandle === handle) {
        stream.write(data);
      }
    });

    const endListener = this.onFileStreamEndEmitter.event(([handle, error]) => {
      if (streamHandle === handle) {
        if (error) {
          const err = new Error(error.message);
          err.name = error.name ?? "Error";
          err.stack = error.stack;
          stream.end(err);
        }
        else {
          stream.end();
        }
        cleanup();
      }
    });

    function cleanup() {
      dataListener.dispose();
      endListener.dispose();
      cancelListener?.dispose();
    }

    stream.on("end", () => cleanup());

    if (this.server) {
      this.server.readFileStream(resource.toString(), streamHandle, opts ?? {}, token ?? { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => { } }) })
        .then(() => {
          if (token?.isCancellationRequested) {
            stream.end(new Error("Cancelled"));
          }
        }, error => stream.end(error));
    }

    return stream;
  }

  watch(resource: URI): () => void {
    if (!this.server) {
      throw new Error("RPC connection not initialized");
    }
    const watcherId = this.streamHandleSeq++;
    this.server.watch(watcherId, resource.toString(), { recursive: false });
    return () => {
      this.server!.unwatch(watcherId);
    };
  }
}

export const remoteFileSystemProvider = new RemoteFileSystemProvider();
