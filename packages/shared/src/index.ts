export { IntervalTimer } from "./async.js";
export { CharCode } from "./char-code.js";

export { isEditableElement, isHTMLElement } from "./dom.js";
export { equals } from "./equals.js";
export { illegalArgument, illegalState } from "./error-utils.js";
export {
  Disposable,
  DisposableStore,
  dispose,
  isDisposable,
  toDisposable,
} from "./lifecycle.js";
export type { IDisposable } from "./lifecycle.js";
export { isLinux, isMacintosh, isWindows, OperatingSystem, OS } from "./platform.js";
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
} from "./string-utils.js";
