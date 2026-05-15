/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's nullFileSystemProvider for Atlas tests.

import type { URI } from "@platform/common/uri/uri";
import type { IDisposable } from "@core/base/lifecycle";
import type { ReadableStreamEvents } from "@core/base/stream";
import type { CancellationToken } from "@core/base/cancellation";

import { Emitter } from "@core/base/event";
import { Disposable } from "@core/base/lifecycle";

import type {
  FileType,
  IFileChange,
  IFileDeleteOptions,
  IFileOpenOptions,
  IFileOverwriteOptions,
  IFileReadStreamOptions,
  IFileSystemProvider,
  IFileWriteOptions,
  IStat,
  IWatchOptions,
} from "../../common/files";

import {
  FileSystemProviderCapabilities,

} from "../../common/files";

export class NullFileSystemProvider implements IFileSystemProvider {
  capabilities: FileSystemProviderCapabilities = FileSystemProviderCapabilities.Readonly;

  private readonly _onDidChangeCapabilities = new Emitter<void>();
  readonly onDidChangeCapabilities = this._onDidChangeCapabilities.event;

  private readonly _onDidChangeFile = new Emitter<readonly IFileChange[]>();
  readonly onDidChangeFile = this._onDidChangeFile.event;

  constructor(private disposableFactory: () => IDisposable = () => Disposable.None) {}

  emitFileChangeEvents(changes: IFileChange[]): void {
    this._onDidChangeFile.fire(changes);
  }

  setCapabilities(capabilities: FileSystemProviderCapabilities): void {
    this.capabilities = capabilities;
    this._onDidChangeCapabilities.fire();
  }

  watch(_resource: URI, _opts: IWatchOptions): IDisposable {
    return this.disposableFactory();
  }

  async stat(_resource: URI): Promise<IStat> {
    return undefined!;
  }

  async mkdir(_resource: URI): Promise<void> {
    return undefined;
  }

  async readdir(_resource: URI): Promise<[string, FileType][]> {
    return undefined!;
  }

  async delete(_resource: URI, _opts: IFileDeleteOptions): Promise<void> {
    return undefined;
  }

  async rename(_from: URI, _to: URI, _opts: IFileOverwriteOptions): Promise<void> {
    return undefined;
  }

  async copy(_from: URI, _to: URI, _opts: IFileOverwriteOptions): Promise<void> {
    return undefined;
  }

  async readFile(_resource: URI): Promise<Uint8Array> {
    return undefined!;
  }

  readFileStream(_resource: URI, _opts: IFileReadStreamOptions, _token: CancellationToken): ReadableStreamEvents<Uint8Array> {
    return undefined!;
  }

  async writeFile(_resource: URI, _content: Uint8Array, _opts: IFileWriteOptions): Promise<void> {
    return undefined;
  }

  async open(_resource: URI, _opts: IFileOpenOptions): Promise<number> {
    return undefined!;
  }

  async close(_fd: number): Promise<void> {
    return undefined;
  }

  async read(_fd: number, _pos: number, _data: Uint8Array, _offset: number, _length: number): Promise<number> {
    return undefined!;
  }

  async write(_fd: number, _pos: number, _data: Uint8Array, _offset: number, _length: number): Promise<number> {
    return undefined!;
  }
}
