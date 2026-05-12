/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's resources.ts for Atlas.

import * as paths from "node:path";
import { isLinux, isWindows } from "@core/base/platform";

import { URI, uriToFsPath } from "./uri";

export interface IExtUri {
  compare: (uri1: URI, uri2: URI, ignoreFragment?: boolean) => number;
  isEqual: (uri1: URI | undefined, uri2: URI | undefined, ignoreFragment?: boolean) => boolean;
  isEqualOrParent: (base: URI, parentCandidate: URI, ignoreFragment?: boolean) => boolean;
  getComparisonKey: (uri: URI, ignoreFragment?: boolean) => string;
  ignorePathCasing: (uri: URI) => boolean;
  basenameOrAuthority: (resource: URI) => string;
  basename: (resource: URI) => string;
  extname: (resource: URI) => string;
  dirname: (resource: URI) => URI;
  joinPath: (resource: URI, ...pathFragment: string[]) => URI;
  normalizePath: (resource: URI) => URI;
  relativePath: (from: URI, to: URI) => string | undefined;
  resolvePath: (base: URI, path: string) => URI;
  isAbsolutePath: (resource: URI) => boolean;
  isEqualAuthority: (a1: string, a2: string) => boolean;
  hasTrailingPathSeparator: (resource: URI, sep?: string) => boolean;
  removeTrailingPathSeparator: (resource: URI, sep?: string) => URI;
  addTrailingPathSeparator: (resource: URI, sep?: string) => URI;
}

function equalsIgnoreCase(a: string, b: string): boolean {
  return a.length === b.length && a.toLowerCase() === b.toLowerCase();
}

function strCompare(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

function isEqualAuthority(a1: string | undefined, a2: string | undefined): boolean {
  return a1 === a2 || (a1 !== undefined && a2 !== undefined && equalsIgnoreCase(a1, a2));
}

function originalFSPath(uri: URI): string {
  return uriToFsPath(uri, true);
}

function isEqualOrParentPath(base: string, parentCandidate: string, ignoreCase: boolean, sep: string): boolean {
  if (base === parentCandidate) {
    return true;
  }
  if (!base.startsWith(parentCandidate)) {
    return false;
  }
  const parentCandidateLength = parentCandidate.length;
  if (parentCandidateLength === 0) {
    return true;
  }
  if (parentCandidate[parentCandidateLength - 1] === sep) {
    return true;
  }
  return base[parentCandidateLength] === sep;
}

export class ExtUri implements IExtUri {
  constructor(private _ignorePathCasing: (uri: URI) => boolean) {}

  compare(uri1: URI, uri2: URI, ignoreFragment: boolean = false): number {
    if (uri1 === uri2) {
      return 0;
    }
    return strCompare(this.getComparisonKey(uri1, ignoreFragment), this.getComparisonKey(uri2, ignoreFragment));
  }

  isEqual(uri1: URI | undefined, uri2: URI | undefined, ignoreFragment: boolean = false): boolean {
    if (uri1 === uri2) {
      return true;
    }
    if (!uri1 || !uri2) {
      return false;
    }
    return this.getComparisonKey(uri1, ignoreFragment) === this.getComparisonKey(uri2, ignoreFragment);
  }

  getComparisonKey(uri: URI, ignoreFragment: boolean = false): string {
    return uri.with({
      path: this._ignorePathCasing(uri) ? uri.path.toLowerCase() : undefined,
      fragment: ignoreFragment ? null : undefined,
    }).toString();
  }

  ignorePathCasing(uri: URI): boolean {
    return this._ignorePathCasing(uri);
  }

  isEqualOrParent(base: URI, parentCandidate: URI, ignoreFragment: boolean = false): boolean {
    if (base.scheme !== parentCandidate.scheme) {
      return false;
    }
    if (base.scheme === "file") {
      return isEqualOrParentPath(originalFSPath(base), originalFSPath(parentCandidate), this._ignorePathCasing(base), paths.sep)
        && base.query === parentCandidate.query
        && (ignoreFragment || base.fragment === parentCandidate.fragment);
    }
    if (isEqualAuthority(base.authority, parentCandidate.authority)) {
      return isEqualOrParentPath(base.path, parentCandidate.path, this._ignorePathCasing(base), "/")
        && base.query === parentCandidate.query
        && (ignoreFragment || base.fragment === parentCandidate.fragment);
    }
    return false;
  }

  joinPath(resource: URI, ...pathFragment: string[]): URI {
    return URI.joinPath(resource, ...pathFragment);
  }

  basenameOrAuthority(resource: URI): string {
    return this.basename(resource) || resource.authority;
  }

  basename(resource: URI, suffix?: string): string {
    return paths.posix.basename(resource.path, suffix);
  }

  extname(resource: URI): string {
    return paths.posix.extname(resource.path);
  }

  dirname(resource: URI): URI {
    if (resource.path.length === 0) {
      return resource;
    }
    let dirname: string;
    if (resource.scheme === "file") {
      dirname = URI.file(paths.dirname(originalFSPath(resource))).path;
    }
    else {
      dirname = paths.posix.dirname(resource.path);
      if (resource.authority && dirname.length && dirname.charCodeAt(0) !== 47) {
        console.error(`dirname("${resource.toString()}") resulted in a relative path`);
        dirname = "/";
      }
    }
    return resource.with({
      path: dirname,
    });
  }

  normalizePath(resource: URI): URI {
    if (!resource.path.length) {
      return resource;
    }
    let normalizedPath: string;
    if (resource.scheme === "file") {
      normalizedPath = URI.file(paths.normalize(originalFSPath(resource))).path;
    }
    else {
      normalizedPath = paths.posix.normalize(resource.path);
    }
    return resource.with({
      path: normalizedPath,
    });
  }

  relativePath(from: URI, to: URI): string | undefined {
    if (from.scheme !== to.scheme || !isEqualAuthority(from.authority, to.authority)) {
      return undefined;
    }
    if (from.scheme === "file") {
      const relativePath = paths.relative(originalFSPath(from), originalFSPath(to));
      return isWindows ? relativePath.replace(/\\/g, "/") : relativePath;
    }
    let fromPath = from.path || "/";
    const toPath = to.path || "/";
    if (this._ignorePathCasing(from)) {
      let i = 0;
      for (const len = Math.min(fromPath.length, toPath.length); i < len; i++) {
        if (fromPath.charCodeAt(i) !== toPath.charCodeAt(i)) {
          if (fromPath.charAt(i).toLowerCase() !== toPath.charAt(i).toLowerCase()) {
            break;
          }
        }
      }
      fromPath = toPath.substring(0, i) + fromPath.substring(i);
    }
    return paths.posix.relative(fromPath, toPath);
  }

  resolvePath(base: URI, path: string): URI {
    if (base.scheme === "file") {
      const newURI = URI.file(paths.resolve(originalFSPath(base), path));
      return base.with({
        authority: newURI.authority,
        path: newURI.path,
      });
    }
    path = path.replace(/\\/g, "/");
    return base.with({
      path: paths.posix.resolve(base.path, path),
    });
  }

  isAbsolutePath(resource: URI): boolean {
    return !!resource.path && resource.path[0] === "/";
  }

  isEqualAuthority(a1: string | undefined, a2: string | undefined): boolean {
    return isEqualAuthority(a1, a2);
  }

  hasTrailingPathSeparator(resource: URI, sep: string = paths.sep): boolean {
    if (resource.scheme === "file") {
      const fsp = originalFSPath(resource);
      const root = paths.parse(fsp).root;
      return fsp.length > root.length && fsp[fsp.length - 1] === sep;
    }
    else {
      const p = resource.path;
      return (p.length > 1 && p.charCodeAt(p.length - 1) === 47) && !(/^[a-z]:(?:\/$|\\$)/i.test(resource.fsPath));
    }
  }

  removeTrailingPathSeparator(resource: URI, sep: string = paths.sep): URI {
    if (this.hasTrailingPathSeparator(resource, sep)) {
      return resource.with({ path: resource.path.substring(0, resource.path.length - 1) });
    }
    return resource;
  }

  addTrailingPathSeparator(resource: URI, sep: string = paths.sep): URI {
    let isRootSep = false;
    if (resource.scheme === "file") {
      const fsp = originalFSPath(resource);
      const root = paths.parse(fsp).root;
      isRootSep = ((fsp !== undefined) && (fsp.length === root.length) && (fsp[fsp.length - 1] === sep));
    }
    else {
      sep = "/";
      const p = resource.path;
      isRootSep = p.length === 1 && p.charCodeAt(p.length - 1) === 47;
    }
    if (!isRootSep && !this.hasTrailingPathSeparator(resource, sep)) {
      return resource.with({ path: `${resource.path}/` });
    }
    return resource;
  }
}

export const extUri = new ExtUri(() => false);

export const extUriBiasedIgnorePathCase = new ExtUri((uri) => {
  return uri.scheme === "file" ? !isLinux : true;
});

export const extUriIgnorePathCase = new ExtUri(_ => true);

export const isEqual = extUri.isEqual.bind(extUri);
export const isEqualOrParent = extUri.isEqualOrParent.bind(extUri);
export const getComparisonKey = extUri.getComparisonKey.bind(extUri);
export const basenameOrAuthority = extUri.basenameOrAuthority.bind(extUri);
export const basename = extUri.basename.bind(extUri);
export const extname = extUri.extname.bind(extUri);
export const dirname = extUri.dirname.bind(extUri);
export const joinPath = extUri.joinPath.bind(extUri);
export const normalizePath = extUri.normalizePath.bind(extUri);
export const relativePath = extUri.relativePath.bind(extUri);
export const resolvePath = extUri.resolvePath.bind(extUri);
export const isAbsolutePath = extUri.isAbsolutePath.bind(extUri);
export const hasTrailingPathSeparator = extUri.hasTrailingPathSeparator.bind(extUri);
export const removeTrailingPathSeparator = extUri.removeTrailingPathSeparator.bind(extUri);
export const addTrailingPathSeparator = extUri.addTrailingPathSeparator.bind(extUri);
