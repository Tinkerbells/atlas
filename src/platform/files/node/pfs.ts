/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's pfs implementation for Atlas.

import * as fs from "node:fs";
import { promisify } from "node:util";
import { isMacintosh, isWindows } from "@core/base/platform";

export interface IDirent {
  name: string;
  isFile: () => boolean;
  isDirectory: () => boolean;
  isSymbolicLink: () => boolean;
}

export namespace SymlinkSupport {

  export interface IStats {
    stat: fs.Stats;
    symbolicLink?: { dangling: boolean };
  }

  export async function stat(path: string): Promise<IStats> {
    let lstats: fs.Stats | undefined;
    try {
      lstats = await fs.promises.lstat(path);

      if (!lstats.isSymbolicLink()) {
        return { stat: lstats };
      }
    }
    catch {
      /* ignore - use stat() instead */
    }

    try {
      const stats = await fs.promises.stat(path);

      return { stat: stats, symbolicLink: lstats?.isSymbolicLink() ? { dangling: false } : undefined };
    }
    catch (error: any) {
      if (error.code === "ENOENT" && lstats) {
        return { stat: lstats, symbolicLink: { dangling: true } };
      }

      if (isWindows && error.code === "EACCES") {
        try {
          const stats = await fs.promises.stat(await fs.promises.readlink(path));
          return { stat: stats, symbolicLink: { dangling: false } };
        }
        catch (error2: any) {
          if (error2.code === "ENOENT" && lstats) {
            return { stat: lstats, symbolicLink: { dangling: true } };
          }
          throw error2;
        }
      }

      throw error;
    }
  }

  export async function existsFile(path: string): Promise<boolean> {
    try {
      const { stat, symbolicLink } = await SymlinkSupport.stat(path);
      return stat.isFile() && symbolicLink?.dangling !== true;
    }
    catch {
      return false;
    }
  }

  export async function existsDirectory(path: string): Promise<boolean> {
    try {
      const { stat, symbolicLink } = await SymlinkSupport.stat(path);
      return stat.isDirectory() && symbolicLink?.dangling !== true;
    }
    catch {
      return false;
    }
  }
}

export enum RimRafMode {
  UNLINK,
  MOVE,
}

async function rimraf(path: string, mode = RimRafMode.UNLINK, moveToPath?: string): Promise<void> {
  if (mode === RimRafMode.UNLINK) {
    await fs.promises.rm(path, { recursive: true, force: true, maxRetries: 3 });
  }
  else {
    const tmpPath = moveToPath || `${path}.${Date.now()}.tmp`;
    try {
      await fs.promises.rename(path, tmpPath);
      fs.promises.rm(tmpPath, { recursive: true, force: true }).catch(() => { /* ignore */ });
    }
    catch (error: any) {
      if (error.code === "ENOENT") {
        return;
      }
      await rimraf(path, RimRafMode.UNLINK);
    }
  }
}

async function doReaddir(path: string, options?: { withFileTypes: true }): Promise<(string | IDirent)[]> {
  try {
    if (options) {
      return await fs.promises.readdir(path, { withFileTypes: true });
    }
    return await fs.promises.readdir(path);
  }
  catch (error: any) {
    if (error.code === "ENOENT" && isWindows && /^[a-z]:\\?$/i.test(path)) {
      try {
        if (options) {
          return await fs.promises.readdir(`${path}.`, { withFileTypes: true });
        }
        return await fs.promises.readdir(`${path}.`);
      }
      catch {
        // ignore
      }
    }
    throw error;
  }
}

function handleDirectoryChildren<T extends string | IDirent>(children: T[]): T[] {
  return children.map((child) => {
    if (typeof child === "string") {
      return isMacintosh ? child.normalize("NFC") : child;
    }
    (child as IDirent).name = isMacintosh ? (child as IDirent).name.normalize("NFC") : (child as IDirent).name;
    return child;
  }) as T[];
}

export const Promises = new class {
  get read() {
    return (fd: number, buffer: Uint8Array, offset: number, length: number, position: number | null) => {
      return new Promise<{ bytesRead: number; buffer: Uint8Array }>((resolve, reject) => {
        fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
          if (err) {
            return reject(err);
          }
          return resolve({ bytesRead, buffer });
        });
      });
    };
  }

  get write() {
    return (fd: number, buffer: Uint8Array, offset: number | undefined | null, length: number | undefined | null, position: number | undefined | null) => {
      return new Promise<{ bytesWritten: number; buffer: Uint8Array }>((resolve, reject) => {
        fs.write(fd, buffer, offset, length, position, (err, bytesWritten, buffer) => {
          if (err) {
            return reject(err);
          }
          return resolve({ bytesWritten, buffer });
        });
      });
    };
  }

  get fdatasync() { return promisify(fs.fdatasync); }
  get open() { return promisify(fs.open); }
  get close() { return promisify(fs.close); }
  get ftruncate() { return promisify(fs.ftruncate); }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.promises.access(path);
      return true;
    }
    catch {
      return false;
    }
  }

  async readdir(path: string): Promise<string[]>;
  async readdir(path: string, options: { withFileTypes: true }): Promise<IDirent[]>;
  async readdir(path: string, options?: { withFileTypes: true }): Promise<(string | IDirent)[]> {
    if (options) {
      return handleDirectoryChildren(await doReaddir(path, options));
    }
    return handleDirectoryChildren(await doReaddir(path));
  }

  get writeFile() { return fs.promises.writeFile; }
  get mkdir() { return fs.promises.mkdir; }
  get unlink() { return fs.promises.unlink; }
  get rmdir() { return fs.promises.rmdir; }
  get rename() { return fs.promises.rename; }
  get copyFile() { return fs.promises.copyFile; }
  get readlink() { return fs.promises.readlink; }
  get symlink() { return fs.promises.symlink; }
  get chmod() { return fs.promises.chmod; }
  get stat() { return fs.promises.stat; }
  get lstat() { return fs.promises.lstat; }
  get readFile() { return fs.promises.readFile; }
  get realpath() { return promisify(fs.realpath); }

  get rm() { return rimraf; }
  get copy() { return copy; }
}();

interface ICopyPayload {
  readonly root: { source: string; target: string };
  readonly options: { preserveSymlinks: boolean };
  readonly handledSourcePaths: Set<string>;
}

const COPY_MODE_MASK = 0o777;

async function copy(source: string, target: string, options: { preserveSymlinks: boolean }): Promise<void> {
  return doCopy(source, target, { root: { source, target }, options, handledSourcePaths: new Set<string>() });
}

async function doCopy(source: string, target: string, payload: ICopyPayload): Promise<void> {
  if (payload.handledSourcePaths.has(source)) {
    return;
  }
  else {
    payload.handledSourcePaths.add(source);
  }

  const { stat, symbolicLink } = await SymlinkSupport.stat(source);

  if (symbolicLink) {
    if (payload.options.preserveSymlinks) {
      try {
        return await doCopySymlink(source, target, payload);
      }
      catch {
        // fallback to normal copy via dereferencing
      }
    }

    if (symbolicLink.dangling) {
      return;
    }
  }

  if (stat.isDirectory()) {
    return doCopyDirectory(source, target, stat.mode & COPY_MODE_MASK, payload);
  }
  else {
    return doCopyFile(source, target, stat.mode & COPY_MODE_MASK);
  }
}

async function doCopyDirectory(source: string, target: string, mode: number, payload: ICopyPayload): Promise<void> {
  await fs.promises.mkdir(target, { recursive: true, mode });
  const files = await Promises.readdir(source);
  for (const file of files) {
    await doCopy(`${source}/${file}`, `${target}/${file}`, payload);
  }
}

async function doCopyFile(source: string, target: string, mode: number): Promise<void> {
  await fs.promises.copyFile(source, target);
  await fs.promises.chmod(target, mode);
}

async function doCopySymlink(source: string, target: string, payload: ICopyPayload): Promise<void> {
  let linkTarget = await fs.promises.readlink(source);
  if (linkTarget.toLowerCase().startsWith(payload.root.source.toLowerCase())) {
    linkTarget = `${payload.root.target}${linkTarget.substring(payload.root.source.length)}`;
  }
  await fs.promises.symlink(linkTarget, target);
}
