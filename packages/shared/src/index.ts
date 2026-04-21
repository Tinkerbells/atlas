export { IntervalTimer } from "./async";
export { CharCode } from "./char-code";

export { isEditableElement, isHTMLElement } from "./dom";
export { equals } from "./equals";
export { illegalArgument, illegalState } from "./error-utils";
export {
  Disposable,
  DisposableStore,
  dispose,
  isDisposable,
  toDisposable,
} from "./lifecycle";
export type { IDisposable } from "./lifecycle";
export { isLinux, isMacintosh, isWindows, OperatingSystem, OS } from "./platform";
export {
  compareIgnoreCase,
  count,
  endsWith,
  equalsIgnoreCase,
  escape,
  escapeRegExpCharacters,
  format,
  format2,
  indexOfIgnoreCase,
  isAsciiDigit,
  isAsciiLetter,
  isFalsyOrWhitespace,
  isLowerAsciiLetter,
  isUpperAsciiLetter,
  startsWithIgnoreCase,
} from "./string-utils";
