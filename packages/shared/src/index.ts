export {
  Disposable,
  DisposableStore,
  isDisposable,
  dispose,
  toDisposable,
} from './lifecycle'
export type { IDisposable } from './lifecycle'

export { OperatingSystem, OS, isWindows, isMacintosh, isLinux } from './platform'
export { CharCode } from './char-code'
export {
  isFalsyOrWhitespace,
  format,
  format2,
  escape,
  escapeRegExpCharacters,
  count,
  startsWithIgnoreCase,
  endsWith,
  indexOfIgnoreCase,
  compareIgnoreCase,
  equalsIgnoreCase,
  isAsciiDigit,
  isLowerAsciiLetter,
  isUpperAsciiLetter,
  isAsciiLetter,
} from './string-utils'
export { illegalArgument, illegalState } from './error-utils'
export { isHTMLElement, isEditableElement } from './dom'
export { equals } from './equals'
export { IntervalTimer } from './async'
