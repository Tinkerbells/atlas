export interface Modifiers {
  readonly ctrlKey: boolean
  readonly shiftKey: boolean
  readonly altKey: boolean
  readonly metaKey: boolean
}

export const KeyCode = {
  Unknown: 'Unidentified',

  // --- Управление ---
  Backspace: 'Backspace',
  Tab: 'Tab',
  Enter: 'Enter',
  Escape: 'Escape',
  Space: 'Space',

  // --- Модификаторы (Теперь различаются Left и Right) ---
  ShiftLeft: 'ShiftLeft',
  ShiftRight: 'ShiftRight',
  ControlLeft: 'ControlLeft',
  ControlRight: 'ControlRight',
  AltLeft: 'AltLeft',
  AltRight: 'AltRight',
  MetaLeft: 'MetaLeft',
  MetaRight: 'MetaRight',

  // --- Навигация ---
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  End: 'End',
  Home: 'Home',
  ArrowLeft: 'ArrowLeft',
  ArrowUp: 'ArrowUp',
  ArrowRight: 'ArrowRight',
  ArrowDown: 'ArrowDown',
  Insert: 'Insert',
  Delete: 'Delete',

  // --- Буквы (Всегда Key + Буква, даже при другой раскладке) ---
  KeyA: 'KeyA', KeyB: 'KeyB', KeyC: 'KeyC', KeyD: 'KeyD', KeyE: 'KeyE',
  KeyF: 'KeyF', KeyG: 'KeyG', KeyH: 'KeyH', KeyI: 'KeyI', KeyJ: 'KeyJ',
  KeyK: 'KeyK', KeyL: 'KeyL', KeyM: 'KeyM', KeyN: 'KeyN', KeyO: 'KeyO',
  KeyP: 'KeyP', KeyQ: 'KeyQ', KeyR: 'KeyR', KeyS: 'KeyS', KeyT: 'KeyT',
  KeyU: 'KeyU', KeyV: 'KeyV', KeyW: 'KeyW', KeyX: 'KeyX', KeyY: 'KeyY',
  KeyZ: 'KeyZ',

  // --- Цифры (Верхний ряд) ---
  Digit0: 'Digit0', Digit1: 'Digit1', Digit2: 'Digit2', Digit3: 'Digit3',
  Digit4: 'Digit4', Digit5: 'Digit5', Digit6: 'Digit6', Digit7: 'Digit7',
  Digit8: 'Digit8', Digit9: 'Digit9',

  // --- Функциональные клавиши ---
  F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4', F5: 'F5', F6: 'F6',
  F7: 'F7', F8: 'F8', F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12',

  // --- Символы (Названия по стандарту США) ---
  Semicolon: 'Semicolon',
  Equal: 'Equal',
  Comma: 'Comma',
  Minus: 'Minus',
  Period: 'Period',
  Slash: 'Slash',
  Backquote: 'Backquote',
  BracketLeft: 'BracketLeft',
  Backslash: 'Backslash',
  BracketRight: 'BracketRight',
  Quote: 'Quote',

  // --- Numpad ---
  Numpad0: 'Numpad0', Numpad1: 'Numpad1', Numpad2: 'Numpad2',
  Numpad3: 'Numpad3', Numpad4: 'Numpad4', Numpad5: 'Numpad5',
  Numpad6: 'Numpad6', Numpad7: 'Numpad7', Numpad8: 'Numpad8',
  Numpad9: 'Numpad9',
  NumpadMultiply: 'NumpadMultiply',
  NumpadAdd: 'NumpadAdd',
  NumpadSubtract: 'NumpadSubtract',
  NumpadDecimal: 'NumpadDecimal',
  NumpadDivide: 'NumpadDivide',
  NumpadEnter: 'NumpadEnter',
} as const

export type KeyCode = typeof KeyCode[keyof typeof KeyCode];
