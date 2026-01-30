/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CharCode } from './char-code';

export function isFalsyOrWhitespace(str: string | undefined): boolean {
  if (!str || typeof str !== 'string') {
    return true;
  }
  return str.trim().length === 0;
}

const _formatRegexp = /{(\d+)}/g;

export function format(value: string, ...args: any[]): string {
  if (args.length === 0) {
    return value;
  }
  return value.replace(_formatRegexp, function (match, group) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const idx = parseInt(group, 10);
    return isNaN(idx) || idx < 0 || idx >= args.length ? match : args[idx];
  });
}

const _format2Regexp = /{([^}]+)}/g;

export function format2(
  template: string,
  values: Record<string, unknown>,
): string {
  if (Object.keys(values).length === 0) {
    return template;
  }
  return template.replace(
    _format2Regexp,
    (match, group) => (values[group] ?? match) as string,
  );
}

export function htmlAttributeEncodeValue(value: string): string {
  return value.replace(/[<>"'&]/g, (ch) => {
    switch (ch) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&apos;';
      case '&':
        return '&amp;';
    }
    return ch;
  });
}

export function escape(html: string): string {
  return html.replace(/[<>&]/g, function (match) {
    switch (match) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      default:
        return match;
    }
  });
}

export function escapeRegExpCharacters(value: string): string {
  // eslint-disable-next-line no-useless-escape
  return value.replace(/[\\\{\}\*\+\?\|\^\$\.\[\]\(\)]/g, '\\$&');
}

export function count(value: string, substr: string): number {
  let result = 0;
  let index = value.indexOf(substr);
  while (index !== -1) {
    result++;
    index = value.indexOf(substr, index + substr.length);
  }
  return result;
}

export function startsWithIgnoreCase(str: string, candidate: string): boolean {
  const candidateLength = candidate.length;
  if (candidate.length > str.length) {
    return false;
  }
  return (
    str.slice(0, candidateLength).toLowerCase() === candidate.toLowerCase()
  );
}

export const endsWith = function (str: string, suffix: string): boolean {
  const len = str.length;
  const i = suffix.length;
  if (i > len) {
    return false;
  }
  return str.slice(len - i) === suffix;
};

export function indexOfIgnoreCase(
  str: string,
  value: string,
  startPosition = 0,
): number {
  const index = str.indexOf(value, startPosition);
  if (index < 0) {
    return index;
  }
  if (str.startsWith(value, index)) {
    return index;
  }

  const strLen = str.length;
  const valLen = value.length;

  for (let i = startPosition; i + valLen <= strLen; i++) {
    if (str.substring(i, i + valLen).toLowerCase() === value.toLowerCase()) {
      return i;
    }
  }

  return -1;
}

export function compareIgnoreCase(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const codeA = a.charCodeAt(i);
    const codeB = b.charCodeAt(i);
    if (codeA === codeB) {
      if (codeA >= CharCode.A && codeA <= CharCode.Z) {
        const diff = (codeB | 32) - (codeA | 32);
        if (diff !== 0) {
          return diff;
        }
      }
      continue;
    }

    if (codeA >= CharCode.A && codeA <= CharCode.Z) {
      const codeBUpper = codeB & ~32;
      if (codeBUpper === codeA) {
        continue;
      }
      return codeA - codeBUpper;
    }

    if (codeB >= CharCode.A && codeB <= CharCode.Z) {
      const codeAUpper = codeA & ~32;
      if (codeAUpper === codeB) {
        continue;
      }
      return codeAUpper - codeB;
    }

    return codeA - codeB;
  }

  return a.length - b.length;
}

export function compareSubstringIgnoreCase(
  a: string,
  b: string,
  aStart = 0,
  aEnd = a.length,
  bStart = 0,
  bEnd = b.length,
): number {
  for (; aStart < aEnd && bStart < bEnd; aStart++, bStart++) {
    const codeA = a.charCodeAt(aStart);
    const codeB = b.charCodeAt(bStart);

    if (codeA === codeB) {
      continue;
    }

    if (codeA >= CharCode.A && codeA <= CharCode.Z) {
      const codeBUpper = codeB & ~32;
      if (codeBUpper === codeA) {
        continue;
      }
      return codeA - codeBUpper;
    }

    if (codeB >= CharCode.A && codeB <= CharCode.Z) {
      const codeAUpper = codeA & ~32;
      if (codeAUpper === codeB) {
        continue;
      }
      return codeAUpper - codeB;
    }

    if (codeA >= CharCode.A && codeA <= CharCode.Z) {
      const codeBUpper = codeB & ~32;
      if (codeBUpper === codeA) {
        continue;
      }
      return codeA - codeBUpper;
    }

    if (codeB >= CharCode.A && codeB <= CharCode.Z) {
      const codeAUpper = codeA & ~32;
      if (codeAUpper === codeB) {
        continue;
      }
      return codeAUpper - codeB;
    }

    return codeA - codeB;
  }

  return aEnd - aStart - (bEnd - bStart);
}

export function isAsciiDigit(charCode: number): boolean {
  return charCode >= CharCode.Digit0 && charCode <= CharCode.Digit9;
}

export function isLowerAsciiLetter(charCode: number): boolean {
  return charCode >= CharCode.a && charCode <= CharCode.z;
}

export function isUpperAsciiLetter(charCode: number): boolean {
  return charCode >= CharCode.A && charCode <= CharCode.Z;
}

export function isAsciiLetter(charCode: number): boolean {
  return isLowerAsciiLetter(charCode) || isUpperAsciiLetter(charCode);
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.length === b.length && compareIgnoreCase(a, b) === 0;
}
