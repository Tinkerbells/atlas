/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's diskFileSystemProvider for Atlas.

import type { URI } from "@platform/common/uri/uri";
import type { IDisposable } from "@core/base/lifecycle";
import type { ReadableStreamEvents } from "@core/base/stream";
import type { CancellationToken } from "@core/base/cancellation";

import * as fs from "node:fs";
import { Emitter } from "@core/base/event";
import { ResourceMap } from "@core/base/map";
import { newWriteableStream } from "@core/base/stream";
import { Barrier, retry } from "@core/base/async-queue";
import { isLinux, isWindows } from "@core/base/platform";
import { basename, dirname, join, normalize } from "node:path";
import { DisposableStore, toDisposable } from "@core/base/lifecycle";
import { extUriBiasedIgnorePathCase, joinPath, basename as resourcesBasename, dirname as resourcesDirname } from "@core/base/resources";

import type {
  IFileAtomicReadOptions,
  IFileAtomicWriteOptions,
  IFileChange,
  IFileDeleteOptions,
  IFileOpenOptions,
  IFileOverwriteOptions,
  IFileReadStreamOptions,
  IFileSystemProvider,
  IFileSystemProviderWithFileAtomicReadCapability,
  IFileSystemProviderWithFileAtomicWriteCapability,
  IFileSystemProviderWithFileCloneCapability,
  IFileSystemProviderWithFileFolderCopyCapability,
  IFileSystemProviderWithFileReadStreamCapability,
  IFileSystemProviderWithFileReadWriteCapability,
  IFileSystemProviderWithFileRealpathCapability,
  IFileSystemProviderWithOpenReadWriteCloseCapability,
  IFileWriteOptions,
  IStat,
} from "../common/files";

import { readFileIntoStream } from "./io";
import { Promises, RimRafMode, SymlinkSupport } from "./pfs";
import {
  createFileSystemProviderError,
  FilePermission,
  FileSystemProviderCapabilities,
  FileSystemProviderError,
  FileSystemProviderErrorCode,
  FileType,
  isFileOpenForWriteOptions,
} from "../common/files";

export class DiskFileSystemProvider implements
  IFileSystemProvider,
  IFileSystemProviderWithFileReadWriteCapability,
  IFileSystemProviderWithOpenReadWriteCloseCapability,
  IFileSystemProviderWithFileReadStreamCapability,
  IFileSystemProviderWithFileFolderCopyCapability,
  IFileSystemProviderWithFileAtomicReadCapability,
  IFileSystemProviderWithFileAtomicWriteCapability,
  IFileSystemProviderWithFileCloneCapability,
  IFileSystemProviderWithFileRealpathCapability {
  private static TRACE_LOG_RESOURCE_LOCKS = false;

  readonly onDidChangeCapabilities = () => ({ dispose() {} });

  private _capabilities: FileSystemProviderCapabilities | undefined;
  get capabilities(): FileSystemProviderCapabilities {
    if (!this._capabilities) {
      this._capabilities
        = FileSystemProviderCapabilities.FileReadWrite
          | FileSystemProviderCapabilities.FileOpenReadWriteClose
          | FileSystemProviderCapabilities.FileReadStream
          | FileSystemProviderCapabilities.FileFolderCopy
          | FileSystemProviderCapabilities.FileWriteUnlock
          | FileSystemProviderCapabilities.FileAppend
          | FileSystemProviderCapabilities.FileAtomicRead
          | FileSystemProviderCapabilities.FileAtomicWrite
          | FileSystemProviderCapabilities.FileAtomicDelete
          | FileSystemProviderCapabilities.FileClone
          | FileSystemProviderCapabilities.FileRealpath;

      if (isLinux) {
        this._capabilities |= FileSystemProviderCapabilities.PathCaseSensitive;
      }
    }

    return this._capabilities;
  }

  private readonly _onDidChangeFile = new Emitter<readonly IFileChange[]>();
  readonly onDidChangeFile = this._onDidChangeFile.event;

  private readonly _onDidWatchError = new Emitter<string>();
  readonly onDidWatchError = this._onDidWatchError.event;

  private readonly resourceLocks = new ResourceMap<Barrier>(resource => extUriBiasedIgnorePathCase.getComparisonKey(resource));

  private readonly mapHandleToPos = new Map<number, number>();
  private readonly mapHandleToLock = new Map<number, IDisposable>();
  private readonly writeHandles = new Map<number, URI>();

  private static canFlush = true;

  watch(_resource: URI, _opts: { recursive: boolean; excludes: string[] }): IDisposable {
    return { dispose() {} };
  }

  async stat(resource: URI): Promise<IStat> {
    try {
      const { stat, symbolicLink } = await SymlinkSupport.stat(this.toFilePath(resource));

      let permissions: FilePermission | undefined;
      if ((stat.mode & 0o200) === 0) {
        permissions = FilePermission.Locked;
      }
      if (
        stat.mode & fs.constants.S_IXUSR
        || stat.mode & fs.constants.S_IXGRP
        || stat.mode & fs.constants.S_IXOTH
      ) {
        permissions = (permissions ?? 0) | FilePermission.Executable;
      }

      return {
        type: this.toType(stat, symbolicLink),
        ctime: stat.birthtime.getTime(),
        mtime: stat.mtime.getTime(),
        size: stat.size,
        permissions,
      };
    }
    catch (error: any) {
      throw this.toFileSystemProviderError(error);
    }
  }

  private async statIgnoreError(resource: URI): Promise<IStat | undefined> {
    try {
      return await this.stat(resource);
    }
    catch {
      return undefined;
    }
  }

  async realpath(resource: URI): Promise<string> {
    const filePath = this.toFilePath(resource);
    return Promises.realpath(filePath);
  }

  async readdir(resource: URI): Promise<[string, FileType][]> {
    try {
      const children = await Promises.readdir(this.toFilePath(resource), { withFileTypes: true });

      const result: [string, FileType][] = [];
      await Promise.all(children.map(async (child) => {
        try {
          let type: FileType;
          if (child.isSymbolicLink()) {
            type = (await this.stat(joinPath(resource, child.name))).type;
          }
          else {
            type = this.toType(child);
          }

          result.push([child.name, type]);
        }
        catch {
          // ignore errors for individual entries that can arise from permission denied
        }
      }));

      return result;
    }
    catch (error: any) {
      throw this.toFileSystemProviderError(error);
    }
  }

  private toType(entry: fs.Stats | { isFile: () => boolean; isDirectory: () => boolean; isSymbolicLink: () => boolean }, symbolicLink?: { dangling: boolean }): FileType {
    let type: FileType;
    if (symbolicLink?.dangling) {
      type = FileType.Unknown;
    }
    else if (entry.isFile()) {
      type = FileType.File;
    }
    else if (entry.isDirectory()) {
      type = FileType.Directory;
    }
    else {
      type = FileType.Unknown;
    }

    if (symbolicLink) {
      type |= FileType.SymbolicLink;
    }

    return type;
  }

  async readFile(resource: URI, options?: IFileAtomicReadOptions): Promise<Uint8Array> {
    let lock: IDisposable | undefined;
    try {
      if (options?.atomic) {
        lock = await this.createResourceLock(resource);
      }

      return await Promises.readFile(this.toFilePath(resource));
    }
    catch (error: any) {
      throw this.toFileSystemProviderError(error);
    }
    finally {
      lock?.dispose();
    }
  }

  private async createResourceLock(resource: URI): Promise<IDisposable> {
    let existingLock = this.resourceLocks.get(resource);
    while (existingLock) {
      await existingLock.wait();
      existingLock = this.resourceLocks.get(resource);
    }

    const newLock = new Barrier();
    this.resourceLocks.set(resource, newLock);

    return toDisposable(() => {
      if (this.resourceLocks.get(resource) === newLock) {
        this.resourceLocks.delete(resource);
      }
      newLock.open();
    });
  }

  readFileStream(resource: URI, opts: IFileReadStreamOptions, token: CancellationToken): ReadableStreamEvents<Uint8Array> {
    const stream = newWriteableStream<Uint8Array>((data) => {
      let length = 0;
      for (const chunk of data) {
        length += chunk.byteLength;
      }
      const result = new Uint8Array(length);
      let offset = 0;
      for (const chunk of data) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return result;
    });

    readFileIntoStream(this, resource, stream, data => data.buffer, {
      ...opts,
      bufferSize: 256 * 1024,
    }, token);

    return stream;
  }

  async writeFile(resource: URI, content: Uint8Array, opts?: IFileAtomicWriteOptions): Promise<void> {
    const writeOpts = (opts ?? { atomic: false }) as IFileWriteOptions;
    if (writeOpts.atomic !== false && writeOpts.atomic?.postfix && await this.canWriteFileAtomic(resource)) {
      return this.doWriteFileAtomic(resource, joinPath(resourcesDirname(resource), `${resourcesBasename(resource)}${writeOpts.atomic.postfix}`), content, writeOpts);
    }
    else {
      return this.doWriteFile(resource, content, writeOpts);
    }
  }

  private async canWriteFileAtomic(resource: URI): Promise<boolean> {
    try {
      const { symbolicLink } = await SymlinkSupport.stat(this.toFilePath(resource));
      if (symbolicLink) {
        return false;
      }
    }
    catch {
      // ignore stat errors here and just proceed trying to write
    }

    return true;
  }

  private async doWriteFileAtomic(resource: URI, tempResource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void> {
    const locks = new DisposableStore();

    try {
      locks.add(await this.createResourceLock(resource));
      locks.add(await this.createResourceLock(tempResource));

      await this.doWriteFile(tempResource, content, { ...opts, create: true, overwrite: true }, true);

      try {
        await this.rename(tempResource, resource, { overwrite: true });
      }
      catch (error: any) {
        try {
          await this.delete(tempResource, { recursive: false, useTrash: false, atomic: false });
        }
        catch {
          // ignore - we want the outer error to bubble up
        }

        throw error;
      }
    }
    finally {
      locks.dispose();
    }
  }

  private async doWriteFile(resource: URI, content: Uint8Array, opts: IFileWriteOptions, disableWriteLock?: boolean): Promise<void> {
    let handle: number | undefined;
    try {
      const filePath = this.toFilePath(resource);

      if (!opts.create || !opts.overwrite) {
        const fileExists = await Promises.exists(filePath);
        if (fileExists) {
          if (!opts.overwrite) {
            throw createFileSystemProviderError("File already exists", FileSystemProviderErrorCode.FileExists);
          }
        }
        else {
          if (!opts.create) {
            throw createFileSystemProviderError("File does not exist", FileSystemProviderErrorCode.FileNotFound);
          }
        }
      }

      handle = await this.open(resource, { create: true, append: opts.append, unlock: opts.unlock }, disableWriteLock);

      await this.write(handle, 0, content, 0, content.byteLength);
    }
    catch (error: any) {
      throw await this.toFileSystemProviderWriteError(resource, error);
    }
    finally {
      if (typeof handle === "number") {
        await this.close(handle);
      }
    }
  }

  async open(resource: URI, opts: IFileOpenOptions, disableWriteLock?: boolean): Promise<number> {
    const filePath = this.toFilePath(resource);

    let lock: IDisposable | undefined;
    if (isFileOpenForWriteOptions(opts) && !disableWriteLock) {
      lock = await this.createResourceLock(resource);
    }

    let fd: number | undefined;
    try {
      if (isFileOpenForWriteOptions(opts) && opts.unlock) {
        try {
          const { stat } = await SymlinkSupport.stat(filePath);
          if (!(stat.mode & 0o200)) {
            await Promises.chmod(filePath, stat.mode | 0o200);
          }
        }
        catch (error: any) {
          if (error.code !== "ENOENT") {
            console.trace(error);
          }
        }
      }

      if (isWindows && isFileOpenForWriteOptions(opts) && !opts.append) {
        try {
          fd = await Promises.open(filePath, "r+");
          await Promises.ftruncate(fd, 0);
        }
        catch (error: any) {
          if (error.code !== "ENOENT") {
            console.trace(error);
          }

          if (typeof fd === "number") {
            try {
              await Promises.close(fd);
            }
            catch {
              // ignore
            }
            fd = undefined;
          }
        }
      }

      if (typeof fd !== "number") {
        fd = await Promises.open(filePath, isFileOpenForWriteOptions(opts)
          ? (opts.append ? "a" : "w")
          : "r");
      }
    }
    catch (error: any) {
      lock?.dispose();

      if (isFileOpenForWriteOptions(opts)) {
        throw await this.toFileSystemProviderWriteError(resource, error);
      }
      else {
        throw this.toFileSystemProviderError(error);
      }
    }

    this.mapHandleToPos.set(fd, 0);

    if (isFileOpenForWriteOptions(opts)) {
      this.writeHandles.set(fd, resource);
    }

    if (lock) {
      const previousLock = this.mapHandleToLock.get(fd);
      this.mapHandleToLock.set(fd, lock);
      if (previousLock) {
        previousLock.dispose();
      }
    }

    return fd;
  }

  async close(fd: number): Promise<void> {
    const lockForHandle = this.mapHandleToLock.get(fd);

    try {
      this.mapHandleToPos.delete(fd);

      if (this.writeHandles.delete(fd) && DiskFileSystemProvider.canFlush) {
        try {
          await Promises.fdatasync(fd);
        }
        catch (error: any) {
          DiskFileSystemProvider.canFlush = false;
          console.error(error);
        }
      }

      return await Promises.close(fd);
    }
    catch (error: any) {
      throw this.toFileSystemProviderError(error);
    }
    finally {
      if (lockForHandle) {
        if (this.mapHandleToLock.get(fd) === lockForHandle) {
          this.mapHandleToLock.delete(fd);
        }
        lockForHandle.dispose();
      }
    }
  }

  async read(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
    const normalizedPos = this.normalizePos(fd, pos);

    let bytesRead: number | null = null;
    try {
      bytesRead = (await Promises.read(fd, data, offset, length, normalizedPos)).bytesRead;
    }
    catch (error: any) {
      throw this.toFileSystemProviderError(error);
    }
    finally {
      this.updatePos(fd, normalizedPos, bytesRead);
    }

    return bytesRead;
  }

  private normalizePos(fd: number, pos: number): number | null {
    if (pos === this.mapHandleToPos.get(fd)) {
      return null;
    }

    return pos;
  }

  private updatePos(fd: number, pos: number | null, bytesLength: number | null): void {
    const lastKnownPos = this.mapHandleToPos.get(fd);
    if (typeof lastKnownPos === "number") {
      if (typeof pos === "number") {
        // do not modify the position
      }
      else if (typeof bytesLength === "number") {
        this.mapHandleToPos.set(fd, lastKnownPos + bytesLength);
      }
      else {
        this.mapHandleToPos.delete(fd);
      }
    }
  }

  async write(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
    return retry(() => this.doWrite(fd, pos, data, offset, length), 100, 3);
  }

  private async doWrite(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
    const normalizedPos = this.normalizePos(fd, pos);

    let bytesWritten: number | null = null;
    try {
      bytesWritten = (await Promises.write(fd, data, offset, length, normalizedPos)).bytesWritten;
    }
    catch (error: any) {
      throw await this.toFileSystemProviderWriteError(this.writeHandles.get(fd), error);
    }
    finally {
      this.updatePos(fd, normalizedPos, bytesWritten);
    }

    return bytesWritten;
  }

  async mkdir(resource: URI): Promise<void> {
    try {
      await Promises.mkdir(this.toFilePath(resource));
    }
    catch (error: any) {
      throw this.toFileSystemProviderError(error);
    }
  }

  async delete(resource: URI, opts: IFileDeleteOptions): Promise<void> {
    try {
      const filePath = this.toFilePath(resource);
      if (opts.recursive) {
        let rmMoveToPath: string | undefined;
        if (opts?.atomic !== false && opts.atomic.postfix) {
          rmMoveToPath = join(dirname(filePath), `${basename(filePath)}${opts.atomic.postfix}`);
        }

        await Promises.rm(filePath, RimRafMode.MOVE, rmMoveToPath);
      }
      else {
        try {
          await Promises.unlink(filePath);
        }
        catch (unlinkError: any) {
          if (unlinkError.code === "EPERM" || unlinkError.code === "EISDIR") {
            let isDirectory = false;
            try {
              const { stat, symbolicLink } = await SymlinkSupport.stat(filePath);
              isDirectory = stat.isDirectory() && !symbolicLink;
            }
            catch {
              // ignore
            }

            if (isDirectory) {
              await Promises.rmdir(filePath);
            }
            else {
              throw unlinkError;
            }
          }
          else {
            throw unlinkError;
          }
        }
      }
    }
    catch (error: any) {
      throw this.toFileSystemProviderError(error);
    }
  }

  async rename(from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void> {
    const fromFilePath = this.toFilePath(from);
    const toFilePath = this.toFilePath(to);

    if (fromFilePath === toFilePath) {
      return;
    }

    try {
      await this.validateMoveCopy(from, to, "move", opts.overwrite);

      await Promises.rename(fromFilePath, toFilePath);
    }
    catch (err: any) {
      let error = err;
      if (err.code === "EINVAL" || err.code === "EBUSY" || err.code === "ENAMETOOLONG") {
        error = new Error(`Unable to move '${basename(fromFilePath)}' into '${basename(dirname(toFilePath))}' (${err.toString()}).`);
      }

      throw this.toFileSystemProviderError(error);
    }
  }

  async copy(from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void> {
    const fromFilePath = this.toFilePath(from);
    const toFilePath = this.toFilePath(to);

    if (fromFilePath === toFilePath) {
      return;
    }

    try {
      await this.validateMoveCopy(from, to, "copy", opts.overwrite);

      await Promises.copy(fromFilePath, toFilePath, { preserveSymlinks: true });
    }
    catch (err: any) {
      let error = err;
      if (err.code === "EINVAL" || err.code === "EBUSY" || err.code === "ENAMETOOLONG") {
        error = new Error(`Unable to copy '${basename(fromFilePath)}' into '${basename(dirname(toFilePath))}' (${err.toString()}).`);
      }

      throw this.toFileSystemProviderError(error);
    }
  }

  private async validateMoveCopy(from: URI, to: URI, mode: "move" | "copy", overwrite?: boolean): Promise<void> {
    const fromFilePath = this.toFilePath(from);
    const toFilePath = this.toFilePath(to);

    let isSameResourceWithDifferentPathCase = false;
    const isPathCaseSensitive = !!(this.capabilities & FileSystemProviderCapabilities.PathCaseSensitive);
    if (!isPathCaseSensitive) {
      isSameResourceWithDifferentPathCase = fromFilePath.toLowerCase() === toFilePath.toLowerCase();
    }

    if (isSameResourceWithDifferentPathCase) {
      if (mode === "copy") {
        throw createFileSystemProviderError("File cannot be copied to same path with different path case", FileSystemProviderErrorCode.FileExists);
      }
      else if (mode === "move") {
        return;
      }
    }

    const fromStat = await this.statIgnoreError(from);
    if (!fromStat) {
      throw createFileSystemProviderError("File to move/copy does not exist", FileSystemProviderErrorCode.FileNotFound);
    }

    const toStat = await this.statIgnoreError(to);
    if (!toStat) {
      return;
    }

    if (!overwrite) {
      throw createFileSystemProviderError("File at target already exists and thus will not be moved/copied to unless overwrite is specified", FileSystemProviderErrorCode.FileExists);
    }

    if ((fromStat.type & FileType.File) !== 0 && (toStat.type & FileType.File) !== 0) {
      // node.js can move/copy a file over an existing file without having to delete it first
    }
    else {
      await this.delete(to, { recursive: true, useTrash: false, atomic: false });
    }
  }

  async cloneFile(from: URI, to: URI): Promise<void> {
    return this.doCloneFile(from, to, false);
  }

  private async doCloneFile(from: URI, to: URI, mkdir: boolean): Promise<void> {
    const fromFilePath = this.toFilePath(from);
    const toFilePath = this.toFilePath(to);

    const isPathCaseSensitive = !!(this.capabilities & FileSystemProviderCapabilities.PathCaseSensitive);
    if (isPathCaseSensitive ? fromFilePath === toFilePath : fromFilePath.toLowerCase() === toFilePath.toLowerCase()) {
      return;
    }

    const locks = new DisposableStore();

    try {
      locks.add(await this.createResourceLock(from));
      locks.add(await this.createResourceLock(to));

      if (mkdir) {
        await Promises.mkdir(dirname(toFilePath), { recursive: true });
      }

      await Promises.copyFile(fromFilePath, toFilePath);
    }
    catch (error: any) {
      if (error.code === "ENOENT" && !mkdir) {
        return this.doCloneFile(from, to, true);
      }

      throw this.toFileSystemProviderError(error);
    }
    finally {
      locks.dispose();
    }
  }

  private toFilePath(resource: URI): string {
    return normalize(resource.fsPath);
  }

  private toFileSystemProviderError(error: NodeJS.ErrnoException): FileSystemProviderError {
    if (error instanceof FileSystemProviderError) {
      return error;
    }

    const resultError: Error | string = error;
    let code: FileSystemProviderErrorCode;
    switch (error.code) {
      case "ENOENT":
        code = FileSystemProviderErrorCode.FileNotFound;
        break;
      case "EISDIR":
        code = FileSystemProviderErrorCode.FileIsADirectory;
        break;
      case "ENOTDIR":
        code = FileSystemProviderErrorCode.FileNotADirectory;
        break;
      case "EEXIST":
        code = FileSystemProviderErrorCode.FileExists;
        break;
      case "EPERM":
      case "EACCES":
        code = FileSystemProviderErrorCode.NoPermissions;
        break;
      default:
        code = FileSystemProviderErrorCode.Unknown;
    }

    return createFileSystemProviderError(resultError, code);
  }

  private async toFileSystemProviderWriteError(resource: URI | undefined, error: NodeJS.ErrnoException): Promise<FileSystemProviderError> {
    let fileSystemProviderWriteError = this.toFileSystemProviderError(error);

    if (resource && fileSystemProviderWriteError.code === FileSystemProviderErrorCode.NoPermissions) {
      try {
        const { stat } = await SymlinkSupport.stat(this.toFilePath(resource));
        if (!(stat.mode & 0o200)) {
          fileSystemProviderWriteError = createFileSystemProviderError(error, FileSystemProviderErrorCode.FileWriteLocked);
        }
      }
      catch {
        // ignore - return original error
      }
    }

    return fileSystemProviderWriteError;
  }
}
