import type { Chord } from './keybindings'
import type { ResolvedChord } from './resolved-keybinding'

import { ResolvedKeybinding } from './resolved-keybinding'

export class BaseResolvedKeybinding<T extends Chord> extends ResolvedKeybinding {
  private readonly _chords: readonly T[]

  constructor(chords: T[]) {
    super()
    this._chords = chords
  }

  // Используется для отображения в UI (например "Ctrl+S")
  public getLabel(): string | null {
    // Простая реализация: делаем первую букву заглавной
    return this._chords.map(p =>
      p.replace('ctrl', 'Ctrl')
        .replace('shift', 'Shift')
        .replace('alt', 'Alt')
        .replace('meta', 'Cmd')
        .replace('Key', ''), // KeyS -> S
    ).join(' ')
  }

  public getAriaLabel(): string | null {
    return this.getLabel()
  }

  public getElectronAccelerator(): string | null {
    return this.getLabel()
  }

  public getUserSettingsLabel(): string | null {
    return this._chords.join(' ')
  }

  public hasMultipleChords(): boolean {
    return this._chords.length > 1
  }

  public getChords(): ResolvedChord[] {
    // Это нужно только если ты строишь сложный UI редактора хоткеев
    // Пока можно вернуть заглушки
    return []
  }

  // Возвращает массив строк типа ["ctrl+KeyS"]
  public getDispatchChords(): (string | null)[] {
    //
    return this._chords.map(keybinding => String(keybinding))
  }
}
