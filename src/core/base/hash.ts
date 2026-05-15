/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's hash implementation for Atlas.

export function hash<T>(obj: T extends ArrayBufferLike | ArrayBufferView ? never : T): number {
  return doHash(obj, 0);
}

export function doHash(obj: unknown, hashVal: number): number {
  switch (typeof obj) {
    case "object":
      if (obj === null) {
        return numberHash(349, hashVal);
      }
      else if (Array.isArray(obj)) {
        return arrayHash(obj, hashVal);
      }
      return objectHash(obj, hashVal);
    case "string":
      return stringHash(obj, hashVal);
    case "boolean":
      return booleanHash(obj, hashVal);
    case "number":
      return numberHash(obj, hashVal);
    case "undefined":
      return numberHash(937, hashVal);
    default:
      return numberHash(617, hashVal);
  }
}

export function numberHash(val: number, initialHashVal: number): number {
  return (((initialHashVal << 5) - initialHashVal) + val) | 0;
}

function booleanHash(b: boolean, initialHashVal: number): number {
  return numberHash(b ? 433 : 863, initialHashVal);
}

export function stringHash(s: string, hashVal: number): number {
  hashVal = numberHash(149417, hashVal);
  for (let i = 0, length = s.length; i < length; i++) {
    hashVal = numberHash(s.charCodeAt(i), hashVal);
  }
  return hashVal;
}

function arrayHash(arr: unknown[], initialHashVal: number): number {
  initialHashVal = numberHash(104579, initialHashVal);
  return arr.reduce<number>((hashVal, item) => doHash(item, hashVal), initialHashVal);
}

function objectHash(obj: object, initialHashVal: number): number {
  initialHashVal = numberHash(181387, initialHashVal);
  return Object.keys(obj).sort().reduce((hashVal, key) => {
    hashVal = stringHash(key, hashVal);
    return doHash((obj as Record<string, unknown>)[key], hashVal);
  }, initialHashVal);
}
