import { KeyCode } from './key-codes'

export interface Modifiers {
  readonly ctrlKey: boolean
  readonly shiftKey: boolean
  readonly altKey: boolean
  readonly metaKey: boolean
}

export class KeyCodeChord implements Modifiers {
  constructor(
    public readonly ctrlKey: boolean,
    public readonly shiftKey: boolean,
    public readonly altKey: boolean,
    public readonly metaKey: boolean,
    public readonly code: KeyCode | string,
  ) { }

  public equals(other: KeyCodeChord): boolean {
    return (
      other instanceof KeyCodeChord
      && this.ctrlKey === other.ctrlKey
      && this.shiftKey === other.shiftKey
      && this.altKey === other.altKey
      && this.metaKey === other.metaKey
      && this.code === other.code
    )
  }

  public getHashCode(): string {
    const ctrl = this.ctrlKey ? 'C' : ''
    const shift = this.shiftKey ? 'S' : ''
    const alt = this.altKey ? 'A' : ''
    const meta = this.metaKey ? 'M' : ''
    return `${ctrl}${shift}${alt}${meta}-${this.code}`
  }

  public isModifierKey(): boolean {
    return (
      this.code === KeyCode.ControlLeft || this.code === KeyCode.ControlRight
      || this.code === KeyCode.ShiftLeft || this.code === KeyCode.ShiftRight
      || this.code === KeyCode.AltLeft || this.code === KeyCode.AltRight
      || this.code === KeyCode.MetaLeft || this.code === KeyCode.MetaRight
    )
  }

  public toKeybinding(): Keybinding {
    return new Keybinding([this])
  }

  /**
   * Проверяет, является ли хорд "дубликатом" модификатора.
   * Например: нажат только Shift (флаг shiftKey=true) и сама клавиша - ShiftLeft.
   */
  public isDuplicateModifierCase(): boolean {
    return (
      (this.ctrlKey && (this.code === KeyCode.ControlLeft || this.code === KeyCode.ControlRight))
      || (this.shiftKey && (this.code === KeyCode.ShiftLeft || this.code === KeyCode.ShiftRight))
      || (this.altKey && (this.code === KeyCode.AltLeft || this.code === KeyCode.AltRight))
      || (this.metaKey && (this.code === KeyCode.MetaLeft || this.code === KeyCode.MetaRight))
    )
  }
}

export type Chord = KeyCodeChord

export class Keybinding {
  public readonly chords: Chord[]

  constructor(chords: Chord[]) {
    if (!chords || chords.length === 0) {
      throw new Error('Keybinding must contain at least one chord.')
    }
    this.chords = chords
  }

  hasMultipleChords(): boolean {
    return this.chords.length > 1
  }

  // NOTE: Нужно для сравнения для проверки дубликатов (как я понял), в VSCode функция "_userSettingsFuzzyEquals". Возможно не потребуется
  equals(other: Keybinding | null | undefined): boolean {
    if (!other)
      return false
    if (this.chords.length !== other.chords.length)
      return false

    for (let i = 0; i < this.chords.length; i++) {
      if (!this.chords[i].equals(other.chords[i]))
        return false
    }
    return true
  }
}

export function toKeyCode(code: string): KeyCode {
  return (KeyCode as any)[code] ?? KeyCode.Unknown
}

function parseChord(str: string): KeyCodeChord {
  const parts = str.split('+').map(p => p.trim()).filter(Boolean)
  const mods = new Set<string>()
  let keyPart: string | null = null
  for (const p of parts) {
    const low = p.toLowerCase()
    if (low === 'ctrl' || low === 'control')
      mods.add('ctrl')
    else if (low === 'shift')
      mods.add('shift')
    else if (low === 'alt' || low === 'option')
      mods.add('alt')
    else if (low === 'meta' || low === 'cmd' || low === 'win' || low === 'super')
      mods.add('meta')
    else keyPart = p // предполагаем, что это code, напр. "KeyC"
  }
  const code = keyPart ? (KeyCode as any)[keyPart] ?? KeyCode.Unknown : KeyCode.Unknown
  return new KeyCodeChord(
    mods.has('ctrl'),
    mods.has('shift'),
    mods.has('alt'),
    mods.has('meta'),
    code,
  )
}

export function decodeKeybinding(input: string | string[] | undefined | null): Keybinding | null {
  if (!input)
    return null
  if (Array.isArray(input)) {
    const chords = input.map(parseChord)
    return new Keybinding(chords)
  }
  const chords = input.split(' ').map(s => s.trim()).filter(Boolean).map(parseChord)
  return chords.length ? new Keybinding(chords) : null
}
