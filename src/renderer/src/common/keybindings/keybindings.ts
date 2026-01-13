// TODO: пока простая строка типа "ctrl+s", позже добавлю логику по работе с KeyCode и битовое сравнение для различных OS
type Chord = string
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

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

function normalizeChord(chord: string): string {
  const parts = chord.split('+').map(p => p.trim()).filter(Boolean)
  const normalized: string[] = []

  for (const part of parts) {
    const lower = part.toLowerCase()

    if (lower === 'mod' || lower === 'cmdorctrl' || lower === 'commandorcontrol') {
      normalized.push(isMac ? 'meta' : 'ctrl')
      continue
    }

    if (lower === 'cmd' || lower === 'command' || lower === 'meta') {
      normalized.push('meta')
      continue
    }

    if (lower === 'ctrl' || lower === 'control') {
      normalized.push('ctrl')
      continue
    }

    if (lower === 'alt' || lower === 'option') {
      normalized.push('alt')
      continue
    }

    if (lower === 'shift') {
      normalized.push('shift')
      continue
    }

    // Поддержка коротких обозначений клавиш: "c" -> "KeyC"
    if (part.length === 1 && /[a-z]/i.test(part)) {
      normalized.push(`Key${part.toUpperCase()}`)
      continue
    }

    normalized.push(part)
  }

  return normalized.join('+')
}

// NOTE: нормализуем биндинг, чтобы совпадал с форматом KeyboardLayoutUtils (ctrl/meta + e.code)
export function decodeKeybinding(keybinding: string[]): Keybinding {
  const normalized = keybinding.map(normalizeChord)
  return new Keybinding(normalized)
}
