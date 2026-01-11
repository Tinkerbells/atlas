// TODO: пока простая строка типа "ctrl+s", позже добавлю логику по работе с KeyCode и битовое сравнение для различных OS
type Chord = string

export class Keybinding {
  public readonly chords: Chord[]

  constructor(chords: Chord[]) {
    if (!chords || chords.length === 0) {
      throw new Error('Keybinding must contain at least one chord.')
    }
    this.chords = [...chords]
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
      if (this.chords[i] !== other.chords[i])
        return false
    }
    return true
  }
}

// NOTE: тут нужно сделать преоброзвание
export function decodeKeybinding(keybinding: string[]): Keybinding {
  return new Keybinding(keybinding)
}
