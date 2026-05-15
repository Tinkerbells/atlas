/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's URI implementation for Atlas.
// Uses Node.js 'path' and 'process' instead of VS Code's platform abstractions.

import { isWindows } from "@core/base/platform";

function _posixJoin(...segments: string[]): string {
  let result = "";
  for (const segment of segments) {
    if (!segment)
      continue;
    if (result) {
      result = `${result.replace(/\/+$/, "")}/${segment.replace(/^\/+/, "")}`;
    }
    else {
      result = segment;
    }
  }
  return result || ".";
}

function _win32Join(...segments: string[]): string {
  let result = "";
  for (const segment of segments) {
    if (!segment)
      continue;
    if (result) {
      result = `${result.replace(/\\+$/, "")}\\${segment.replace(/^\\+/, "")}`;
    }
    else {
      result = segment;
    }
  }
  return result || ".";
}

const _schemePattern = /^\w[\w+.-]*$/;
const _singleSlashStart = /^\//;
const _doubleSlashStart = /^\/\//;

function _validateUri(ret: URI, _strict?: boolean): void {
  if (!ret.scheme && _strict) {
    throw new Error(`[UriError]: Scheme is missing: {scheme: "", authority: "${ret.authority}", path: "${ret.path}", query: "${ret.query}", fragment: "${ret.fragment}"}`);
  }

  if (ret.scheme && !_schemePattern.test(ret.scheme)) {
    const matches = [...ret.scheme.matchAll(/[^\w+.-]/gu)];
    const detail = matches.length > 0
      ? ` Found '${matches[0]![0]}' at index ${matches[0]!.index} (${matches.length} total)`
      : "";
    throw new Error(`[UriError]: Scheme contains illegal characters.${detail} (len:${ret.scheme.length})`);
  }

  if (ret.path) {
    if (ret.authority) {
      if (!_singleSlashStart.test(ret.path)) {
        throw new Error("[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash (\"/\") character");
      }
    }
    else {
      if (_doubleSlashStart.test(ret.path)) {
        throw new Error("[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters (\"//\")");
      }
    }
  }
}

function _schemeFix(scheme: string, _strict: boolean): string {
  if (!scheme && !_strict) {
    return "file";
  }
  return scheme;
}

function _referenceResolution(scheme: string, path: string): string {
  switch (scheme) {
    case "https":
    case "http":
    case "file":
      if (!path) {
        path = _slash;
      }
      else if (path[0] !== _slash) {
        path = _slash + path;
      }
      break;
  }
  return path;
}

const _empty = "";
const _slash = "/";
const _regexp = /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/;

export class URI implements UriComponents {
  static isUri(thing: unknown): thing is URI {
    if (thing instanceof URI) {
      return true;
    }
    if (!thing || typeof thing !== "object") {
      return false;
    }
    return typeof (<URI>thing).authority === "string"
      && typeof (<URI>thing).fragment === "string"
      && typeof (<URI>thing).path === "string"
      && typeof (<URI>thing).query === "string"
      && typeof (<URI>thing).scheme === "string"
      && typeof (<URI>thing).fsPath === "string"
      && typeof (<URI>thing).with === "function"
      && typeof (<URI>thing).toString === "function";
  }

  readonly scheme: string;
  readonly authority: string;
  readonly path: string;
  readonly query: string;
  readonly fragment: string;

  protected constructor(scheme: string, authority?: string, path?: string, query?: string, fragment?: string, _strict?: boolean);
  protected constructor(components: UriComponents);
  protected constructor(schemeOrData: string | UriComponents, authority?: string, path?: string, query?: string, fragment?: string, _strict: boolean = false) {
    if (typeof schemeOrData === "object") {
      this.scheme = schemeOrData.scheme || _empty;
      this.authority = schemeOrData.authority || _empty;
      this.path = schemeOrData.path || _empty;
      this.query = schemeOrData.query || _empty;
      this.fragment = schemeOrData.fragment || _empty;
    }
    else {
      this.scheme = _schemeFix(schemeOrData, _strict);
      this.authority = authority || _empty;
      this.path = _referenceResolution(this.scheme, path || _empty);
      this.query = query || _empty;
      this.fragment = fragment || _empty;

      _validateUri(this, _strict);
    }
  }

  get fsPath(): string {
    return uriToFsPath(this, false);
  }

  with(change: { scheme?: string; authority?: string | null; path?: string | null; query?: string | null; fragment?: string | null }): URI {
    if (!change) {
      return this;
    }

    let { scheme, authority, path, query, fragment } = change;
    if (scheme === undefined) {
      scheme = this.scheme;
    }
    else if (scheme === null) {
      scheme = _empty;
    }
    if (authority === undefined) {
      authority = this.authority;
    }
    else if (authority === null) {
      authority = _empty;
    }
    if (path === undefined) {
      path = this.path;
    }
    else if (path === null) {
      path = _empty;
    }
    if (query === undefined) {
      query = this.query;
    }
    else if (query === null) {
      query = _empty;
    }
    if (fragment === undefined) {
      fragment = this.fragment;
    }
    else if (fragment === null) {
      fragment = _empty;
    }

    if (scheme === this.scheme
      && authority === this.authority
      && path === this.path
      && query === this.query
      && fragment === this.fragment) {
      return this;
    }

    return new _Uri(scheme, authority, path, query, fragment);
  }

  static parse(value: string, _strict: boolean = false): URI {
    const match = _regexp.exec(value);
    if (!match) {
      return new _Uri(_empty, _empty, _empty, _empty, _empty);
    }
    return new _Uri(
      match[1] || _empty,
      percentDecode(match[2] || _empty),
      percentDecode(match[3] || _empty),
      percentDecode(match[4] || _empty),
      percentDecode(match[5] || _empty),
      _strict,
    );
  }

  static file(path: string): URI {
    let authority = _empty;

    if (isWindows) {
      path = path.replace(/\\/g, _slash);
    }

    if (path[0] === _slash && path[1] === _slash) {
      const idx = path.indexOf(_slash, 2);
      if (idx === -1) {
        authority = path.substring(2);
        path = _slash;
      }
      else {
        authority = path.substring(2, idx);
        path = path.substring(idx) || _slash;
      }
    }

    return new _Uri("file", authority, path, _empty, _empty);
  }

  static from(components: UriComponents, strict?: boolean): URI {
    return new _Uri(
      components.scheme,
      components.authority,
      components.path,
      components.query,
      components.fragment,
      strict,
    );
  }

  static joinPath(uri: URI, ...pathFragment: string[]): URI {
    if (!uri.path) {
      throw new Error(`[UriError]: cannot call joinPath on URI without path: ${uri.toString()}`);
    }
    let newPath: string;
    if (isWindows && uri.scheme === "file") {
      newPath = URI.file(_win32Join(uriToFsPath(uri, true), ...pathFragment)).path;
    }
    else {
      newPath = _posixJoin(uri.path, ...pathFragment);
    }
    return uri.with({ path: newPath });
  }

  toString(skipEncoding: boolean = false): string {
    return _asFormatted(this, skipEncoding);
  }

  toJSON(): UriComponents {
    return {
      scheme: this.scheme,
      authority: this.authority,
      path: this.path,
      query: this.query,
      fragment: this.fragment,
    };
  }

  static revive(data: UriComponents | URI): URI;
  static revive(data: UriComponents | URI | undefined): URI | undefined;
  static revive(data: UriComponents | URI | null): URI | null;
  static revive(data: UriComponents | URI | undefined | null): URI | undefined | null {
    if (!data) {
      return data;
    }
    else if (data instanceof URI) {
      return data;
    }
    else {
      const result = new _Uri(data);
      result._formatted = (data as any).external ?? null;
      result._fsPath = (data as any)._sep === _pathSepMarker ? (data as any).fsPath ?? null : null;
      return result;
    }
  }

  [Symbol.for("debug.description")]() {
    return `URI(${this.toString()})`;
  }
}

export interface UriComponents {
  scheme: string;
  authority?: string;
  path?: string;
  query?: string;
  fragment?: string;
}

export function isUriComponents(thing: unknown): thing is UriComponents {
  if (!thing || typeof thing !== "object") {
    return false;
  }
  return typeof (<UriComponents>thing).scheme === "string"
    && (typeof (<UriComponents>thing).authority === "string" || typeof (<UriComponents>thing).authority === "undefined")
    && (typeof (<UriComponents>thing).path === "string" || typeof (<UriComponents>thing).path === "undefined")
    && (typeof (<UriComponents>thing).query === "string" || typeof (<UriComponents>thing).query === "undefined")
    && (typeof (<UriComponents>thing).fragment === "string" || typeof (<UriComponents>thing).fragment === "undefined");
}

const _pathSepMarker = isWindows ? 1 : undefined;

class _Uri extends URI {
  _formatted: string | null = null;
  _fsPath: string | null = null;

  override get fsPath(): string {
    if (!this._fsPath) {
      this._fsPath = uriToFsPath(this, false);
    }
    return this._fsPath;
  }

  override toString(skipEncoding: boolean = false): string {
    if (!skipEncoding) {
      if (!this._formatted) {
        this._formatted = _asFormatted(this, false);
      }
      return this._formatted;
    }
    else {
      return _asFormatted(this, true);
    }
  }

  override toJSON(): UriComponents {
    const res: UriComponents & { external?: string; fsPath?: string; _sep?: number } = {
      scheme: this.scheme,
    };
    if (this._fsPath) {
      res.fsPath = this._fsPath;
      res._sep = _pathSepMarker;
    }
    if (this._formatted) {
      res.external = this._formatted;
    }
    if (this.path) {
      res.path = this.path;
    }
    if (this.authority) {
      res.authority = this.authority;
    }
    if (this.query) {
      res.query = this.query;
    }
    if (this.fragment) {
      res.fragment = this.fragment;
    }
    return res;
  }
}

// --- encoding ---

const enum CharCode {
  Colon = 58,
  Slash = 47,
  QuestionMark = 63,
  Hash = 35,
  OpenSquareBracket = 91,
  CloseSquareBracket = 93,
  AtSign = 64,
  ExclamationMark = 33,
  DollarSign = 36,
  Ampersand = 38,
  SingleQuote = 39,
  OpenParen = 40,
  CloseParen = 41,
  Asterisk = 42,
  Plus = 43,
  Comma = 44,
  Semicolon = 59,
  Equals = 61,
  Space = 32,
  a = 97,
  z = 122,
  A = 65,
  Z = 90,
  Digit0 = 48,
  Digit9 = 57,
  Dash = 45,
  Period = 46,
  Underline = 95,
  Tilde = 126,
}

const encodeTable: { [ch: number]: string } = {
  [CharCode.Colon]: "%3A",
  [CharCode.Slash]: "%2F",
  [CharCode.QuestionMark]: "%3F",
  [CharCode.Hash]: "%23",
  [CharCode.OpenSquareBracket]: "%5B",
  [CharCode.CloseSquareBracket]: "%5D",
  [CharCode.AtSign]: "%40",
  [CharCode.ExclamationMark]: "%21",
  [CharCode.DollarSign]: "%24",
  [CharCode.Ampersand]: "%26",
  [CharCode.SingleQuote]: "%27",
  [CharCode.OpenParen]: "%28",
  [CharCode.CloseParen]: "%29",
  [CharCode.Asterisk]: "%2A",
  [CharCode.Plus]: "%2B",
  [CharCode.Comma]: "%2C",
  [CharCode.Semicolon]: "%3B",
  [CharCode.Equals]: "%3D",
  [CharCode.Space]: "%20",
};

function encodeURIComponentFast(uriComponent: string, isPath: boolean, isAuthority: boolean): string {
  let res: string | undefined;
  let nativeEncodePos = -1;

  for (let pos = 0; pos < uriComponent.length; pos++) {
    const code = uriComponent.charCodeAt(pos);

    if (
      (code >= CharCode.a && code <= CharCode.z)
      || (code >= CharCode.A && code <= CharCode.Z)
      || (code >= CharCode.Digit0 && code <= CharCode.Digit9)
      || code === CharCode.Dash
      || code === CharCode.Period
      || code === CharCode.Underline
      || code === CharCode.Tilde
      || (isPath && code === CharCode.Slash)
      || (isAuthority && code === CharCode.OpenSquareBracket)
      || (isAuthority && code === CharCode.CloseSquareBracket)
      || (isAuthority && code === CharCode.Colon)
    ) {
      if (nativeEncodePos !== -1) {
        res += encodeURIComponent(uriComponent.substring(nativeEncodePos, pos));
        nativeEncodePos = -1;
      }
      if (res !== undefined) {
        res += uriComponent.charAt(pos);
      }
    }
    else {
      if (res === undefined) {
        res = uriComponent.substring(0, pos);
      }
      const escaped = encodeTable[code];
      if (escaped !== undefined) {
        if (nativeEncodePos !== -1) {
          res += encodeURIComponent(uriComponent.substring(nativeEncodePos, pos));
          nativeEncodePos = -1;
        }
        res += escaped;
      }
      else if (nativeEncodePos === -1) {
        nativeEncodePos = pos;
      }
    }
  }

  if (nativeEncodePos !== -1) {
    res += encodeURIComponent(uriComponent.substring(nativeEncodePos));
  }

  return res !== undefined ? res : uriComponent;
}

function encodeURIComponentMinimal(path: string): string {
  let res: string | undefined;
  for (let pos = 0; pos < path.length; pos++) {
    const code = path.charCodeAt(pos);
    if (code === CharCode.Hash || code === CharCode.QuestionMark) {
      if (res === undefined) {
        res = path.substring(0, pos);
      }
      res += encodeTable[code];
    }
    else {
      if (res !== undefined) {
        res += path[pos];
      }
    }
  }
  return res !== undefined ? res : path;
}

export function uriToFsPath(uri: URI, keepDriveLetterCasing: boolean): string {
  let value: string;
  if (uri.authority && uri.path.length > 1 && uri.scheme === "file") {
    value = `//${uri.authority}${uri.path}`;
  }
  else if (
    uri.path.charCodeAt(0) === CharCode.Slash
    && ((uri.path.charCodeAt(1) >= CharCode.A && uri.path.charCodeAt(1) <= CharCode.Z) || (uri.path.charCodeAt(1) >= CharCode.a && uri.path.charCodeAt(1) <= CharCode.z))
    && uri.path.charCodeAt(2) === CharCode.Colon
  ) {
    if (!keepDriveLetterCasing) {
      value = uri.path[1]!.toLowerCase() + uri.path.substring(2);
    }
    else {
      value = uri.path.substring(1);
    }
  }
  else {
    value = uri.path;
  }
  if (isWindows) {
    value = value.replace(/\//g, "\\");
  }
  return value;
}

function _asFormatted(uri: URI, skipEncoding: boolean): string {
  const encoder = !skipEncoding
    ? encodeURIComponentFast
    : encodeURIComponentMinimal;

  let res = "";
  let { scheme, authority, path, query, fragment } = uri;
  if (scheme) {
    res += scheme;
    res += ":";
  }
  if (authority || scheme === "file") {
    res += _slash;
    res += _slash;
  }
  if (authority) {
    let idx = authority.indexOf("@");
    if (idx !== -1) {
      const userinfo = authority.substring(0, idx);
      authority = authority.substring(idx + 1);
      idx = userinfo.lastIndexOf(":");
      if (idx === -1) {
        res += encoder(userinfo, false, false);
      }
      else {
        res += encoder(userinfo.substring(0, idx), false, false);
        res += ":";
        res += encoder(userinfo.substring(idx + 1), false, true);
      }
      res += "@";
    }
    authority = authority.toLowerCase();
    idx = authority.lastIndexOf(":");
    if (idx === -1) {
      res += encoder(authority, false, true);
    }
    else {
      res += encoder(authority.substring(0, idx), false, true);
      res += authority.substring(idx);
    }
  }
  if (path) {
    if (path.length >= 3 && path.charCodeAt(0) === CharCode.Slash && path.charCodeAt(2) === CharCode.Colon) {
      const code = path.charCodeAt(1);
      if (code >= CharCode.A && code <= CharCode.Z) {
        path = `/${String.fromCharCode(code + 32)}:${path.substring(3)}`;
      }
    }
    else if (path.length >= 2 && path.charCodeAt(1) === CharCode.Colon) {
      const code = path.charCodeAt(0);
      if (code >= CharCode.A && code <= CharCode.Z) {
        path = `${String.fromCharCode(code + 32)}:${path.substring(2)}`;
      }
    }
    res += encoder(path, true, false);
  }
  if (query) {
    res += "?";
    res += encoder(query, false, false);
  }
  if (fragment) {
    res += "#";
    res += !skipEncoding ? encodeURIComponentFast(fragment, false, false) : fragment;
  }
  return res;
}

function decodeURIComponentGraceful(str: string): string {
  try {
    return decodeURIComponent(str);
  }
  catch {
    if (str.length > 3) {
      return str.substring(0, 3) + decodeURIComponentGraceful(str.substring(3));
    }
    else {
      return str;
    }
  }
}

const _rEncodedAsHex = /(%[0-9A-Z][0-9A-Z])+/gi;

function percentDecode(str: string): string {
  if (!str.match(_rEncodedAsHex)) {
    return str;
  }
  return str.replace(_rEncodedAsHex, match => decodeURIComponentGraceful(match));
}

export type UriDto<T> = { [K in keyof T]: T[K] extends URI
  ? UriComponents
  : UriDto<T[K]> };
