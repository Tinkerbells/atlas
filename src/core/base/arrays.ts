/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

/**
 * Returns the last entry and the initial N-1 entries of the array, as a tuple of [rest, last].
 *
 * The array must have at least one element.
 *
 * @param arr The input array
 * @returns A tuple of [rest, last] where rest is all but the last element and last is the last element
 * @throws Error if the array is empty
 */
export function tail<T>(arr: T[]): [T[], T] {
  if (arr.length === 0) {
    throw new Error("Invalid tail call");
  }

  return [arr.slice(0, arr.length - 1), arr[arr.length - 1]];
}

export function equals<T>(one: ReadonlyArray<T> | undefined, other: ReadonlyArray<T> | undefined, itemEquals: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
  if (one === other) {
    return true;
  }

  if (!one || !other) {
    return false;
  }

  if (one.length !== other.length) {
    return false;
  }

  for (let i = 0, len = one.length; i < len; i++) {
    if (!itemEquals(one[i], other[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Remove the element at `index` by replacing it with the last element. This is faster than `splice`
 * but changes the order of the array
 */
export function removeFastWithoutKeepingOrder<T>(array: T[], index: number) {
  const last = array.length - 1;
  if (index < last) {
    array[index] = array[last];
  }
  array.pop();
}

/**
 * Performs a binary search algorithm over a sorted array.
 *
 * @param array The array being searched.
 * @param key The value we search for.
 * @param comparator A function that takes two array elements and returns zero
 *   if they are equal, a negative number if the first element precedes the
 *   second one in the sorting order, or a positive number if the second element
 *   precedes the first one.
 * @return See {@link binarySearch2}
 */
export function binarySearch<T>(array: ReadonlyArray<T>, key: T, comparator: (op1: T, op2: T) => number): number {
  return binarySearch2(array.length, i => comparator(array[i], key));
}

/**
 * Performs a binary search algorithm over a sorted collection. Useful for cases
 * when we need to perform a binary search over something that isn't actually an
 * array, and converting data to an array would defeat the use of binary search
 * in the first place.
 *
 * @param length The collection length.
 * @param compareToKey A function that takes an index of an element in the
 *   collection and returns zero if the value at this index is equal to the
 *   search key, a negative number if the value precedes the search key in the
 *   sorting order, or a positive number if the search key precedes the value.
 * @return A non-negative index of an element, if found. If not found, the
 *   result is -(n+1) (or ~n, using bitwise notation), where n is the index
 *   where the key should be inserted to maintain the sorting order.
 */
export function binarySearch2(length: number, compareToKey: (index: number) => number): number {
  let low = 0;
  let high = length - 1;

  while (low <= high) {
    const mid = ((low + high) / 2) | 0;
    const comp = compareToKey(mid);
    if (comp < 0) {
      low = mid + 1;
    }
    else if (comp > 0) {
      high = mid - 1;
    }
    else {
      return mid;
    }
  }
  return -(low + 1);
}

/**
 * @returns New array with all falsy values removed. The original array IS NOT modified.
 */
export function coalesce<T>(array: ReadonlyArray<T | undefined | null>): T[] {
  return array.filter((e): e is T => !!e);
}

/**
 * Remove all falsy values from `array`. The original array IS modified.
 */
export function coalesceInPlace<T>(array: Array<T | undefined | null>): asserts array is Array<T> {
  let to = 0;
  for (let i = 0; i < array.length; i++) {
    if (array[i]) {
      array[to] = array[i];
      to += 1;
    }
  }
  array.length = to;
}

/**
 * @deprecated Use `Array.copyWithin` instead
 */
export function move(array: unknown[], from: number, to: number): void {
  array.splice(to, 0, array.splice(from, 1)[0]);
}

/**
 * @returns false if the provided object is an array and not empty.
 */
export function isFalsyOrEmpty(obj: unknown): boolean {
  return !Array.isArray(obj) || obj.length === 0;
}

/**
 * @returns True if the provided object is an array and has at least one element.
 */
export function isNonEmptyArray<T>(obj: T[] | undefined | null): obj is T[];
export function isNonEmptyArray<T>(obj: readonly T[] | undefined | null): obj is readonly T[];
export function isNonEmptyArray<T>(obj: T[] | readonly T[] | undefined | null): obj is T[] | readonly T[] {
  return Array.isArray(obj) && obj.length > 0;
}

/**
 * Removes duplicates from the given array. The optional keyFn allows to specify
 * how elements are checked for equality by returning an alternate value for each.
 */
export function distinct<T>(array: ReadonlyArray<T>, keyFn: (value: T) => unknown = value => value): T[] {
  const seen = new Set<any>();

  return array.filter((element) => {
    const key = keyFn(element);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function uniqueFilter<T, R>(keyFn: (t: T) => R): (t: T) => boolean {
  const seen = new Set<R>();

  return (element) => {
    const key = keyFn(element);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  };
}

export function commonPrefixLength<T>(one: ReadonlyArray<T>, other: ReadonlyArray<T>, equals: (a: T, b: T) => boolean = (a, b) => a === b): number {
  let result = 0;

  for (let i = 0, len = Math.min(one.length, other.length); i < len; i++) {
    if (!equals(one[i], other[i])) {
      return result;
    }

    result++;
  }

  return result;
}

export function flatten<T>(arr: T[][]): T[] {
  return arr.reduce((result, value) => result.concat(value), [] as T[]);
}
