/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's resources implementation for Atlas.

import { URI } from "@platform/common/uri/uri";

import { isLinux } from "./platform";

export interface IExtUri {
  compare: (uri1: URI, uri2: URI, ignoreFragment?: boolean) => number;
  isEqual: (uri1: URI | undefined, uri2: URI | undefined, ignoreFragment?: boolean) => boolean;
  isEqualOrParent: (base: URI, parentCandidate: URI, ignoreFragment?: boolean) => boolean;
  getComparisonKey: (uri: URI, ignoreFragment?: boolean) => string;
  ignorePathCasing: (uri: URI) => boolean;
  basenameOrAuthority: (resource: URI) => string;
  basename: (resource: URI, suffix?: string) => string;
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

export class ExtUri implements IExtUri {
  constructor(private _ignorePathCasing: (uri: URI) => boolean) { }

  compare(uri1: URI, uri2: URI, ignoreFragment = false): number {
    if (uri1 === uri2) {
      return 0;
    }
    return this.getComparisonKey(uri1, ignoreFragment).localeCompare(this.getComparisonKey(uri2, ignoreFragment));
  }

  isEqual(uri1: URI | undefined, uri2: URI | undefined, ignoreFragment = false): boolean {
    if (uri1 === uri2) {
      return true;
    }
    if (!uri1 || !uri2) {
      return false;
    }
    return this.getComparisonKey(uri1, ignoreFragment) === this.getComparisonKey(uri2, ignoreFragment);
  }

  getComparisonKey(uri: URI, ignoreFragment = false): string {
    return uri.with({
      path: this._ignorePathCasing(uri) ? uri.path.toLowerCase() : undefined,
      fragment: ignoreFragment ? null : undefined,
    }).toString();
  }

  ignorePathCasing(uri: URI): boolean {
    return this._ignorePathCasing(uri);
  }

  isEqualOrParent(base: URI, parentCandidate: URI, _ignoreFragment = false): boolean {
    if (base.scheme === parentCandidate.scheme) {
      if (base.scheme === "file") {
        const basePath = base.fsPath;
        const parentPath = parentCandidate.fsPath;
        const ignoreCase = this._ignorePathCasing(base);
        if (basePath === parentPath) {
          return true;
        }
        if (ignoreCase) {
          if (!basePath.toLowerCase().startsWith(parentPath.toLowerCase()))
            return false;
        }
        else {
          if (!basePath.startsWith(parentPath))
            return false;
        }
        const sep = "/";
        let sepOffset = parentPath.length;
        if (parentPath.charAt(parentPath.length - 1) === sep) {
          sepOffset--;
        }
        return basePath.charAt(sepOffset) === sep;
      }
      if (this.isEqualAuthority(base.authority, parentCandidate.authority)) {
        const basePath = base.path;
        const parentPath = parentCandidate.path;
        const ignoreCase = this._ignorePathCasing(base);
        if (basePath === parentPath) {
          return true;
        }
        if (ignoreCase) {
          if (!basePath.toLowerCase().startsWith(parentPath.toLowerCase()))
            return false;
        }
        else {
          if (!basePath.startsWith(parentPath))
            return false;
        }
        const sep = "/";
        let sepOffset = parentPath.length;
        if (parentPath.charAt(parentPath.length - 1) === sep) {
          sepOffset--;
        }
        return basePath.charAt(sepOffset) === sep;
      }
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
    const path = resource.path;
    if (suffix) {
      const idx = path.lastIndexOf(suffix);
      if (idx >= 0 && idx === path.length - suffix.length) {
        return path.substring(path.lastIndexOf("/") + 1, idx);
      }
    }
    return path.substring(path.lastIndexOf("/") + 1);
  }

  extname(resource: URI): string {
    const base = this.basename(resource);
    const idx = base.lastIndexOf(".");
    return idx >= 0 ? base.substring(idx) : "";
  }

  dirname(resource: URI): URI {
    if (resource.path.length === 0) {
      return resource;
    }
    let dirnamePath: string;
    if (resource.scheme === "file") {
      dirnamePath = resource.path.substring(0, resource.path.lastIndexOf("/"));
    }
    else {
      dirnamePath = resource.path.substring(0, resource.path.lastIndexOf("/"));
      if (resource.authority && dirnamePath.length && dirnamePath.charCodeAt(0) !== 47 /* Slash */) {
        dirnamePath = "/";
      }
    }
    return resource.with({
      path: dirnamePath || "/",
    });
  }

  normalizePath(resource: URI): URI {
    if (!resource.path.length) {
      return resource;
    }
    return resource.with({ path: resource.path });
  }

  relativePath(from: URI, to: URI): string | undefined {
    if (from.scheme !== to.scheme || !this.isEqualAuthority(from.authority, to.authority)) {
      return undefined;
    }
    const fromPath = from.path || "/";
    const toPath = to.path || "/";
    if (fromPath === toPath) {
      return "";
    }
    const fromParts = fromPath.split("/");
    const toParts = toPath.split("/");
    let common = 0;
    while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
      common++;
    }
    const up = fromParts.length - common;
    return new Array(up).fill("..").concat(toParts.slice(common)).join("/");
  }

  resolvePath(base: URI, path: string): URI {
    if (base.scheme === "file") {
      const resolved = `${base.fsPath}/${path}`.replace(/\\/g, "/");
      return base.with({ path: resolved });
    }
    return base.with({ path: `${base.path}/${path}` });
  }

  isAbsolutePath(resource: URI): boolean {
    return !!resource.path && resource.path[0] === "/";
  }

  isEqualAuthority(a1: string | undefined, a2: string | undefined) {
    return a1 === a2 || (a1 !== undefined && a2 !== undefined && a1.toLowerCase() === a2.toLowerCase());
  }

  hasTrailingPathSeparator(resource: URI): boolean {
    const p = resource.path;
    return p.length > 1 && p[p.length - 1] === "/";
  }

  removeTrailingPathSeparator(resource: URI): URI {
    if (this.hasTrailingPathSeparator(resource)) {
      return resource.with({ path: resource.path.substring(0, resource.path.length - 1) });
    }
    return resource;
  }

  addTrailingPathSeparator(resource: URI): URI {
    if (!this.hasTrailingPathSeparator(resource)) {
      return resource.with({ path: `${resource.path}/` });
    }
    return resource;
  }
}

export const extUri = new ExtUri(() => false);

export const extUriBiasedIgnorePathCase = new ExtUri((uri) => {
  return uri.scheme === "file" ? !isLinux : true;
});

export const extUriIgnorePathCase = new ExtUri(() => true);

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
export const isEqualAuthority = extUri.isEqualAuthority.bind(extUri);
export const hasTrailingPathSeparator = extUri.hasTrailingPathSeparator.bind(extUri);
export const removeTrailingPathSeparator = extUri.removeTrailingPathSeparator.bind(extUri);
export const addTrailingPathSeparator = extUri.addTrailingPathSeparator.bind(extUri);
