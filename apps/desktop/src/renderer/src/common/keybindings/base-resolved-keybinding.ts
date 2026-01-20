import type { Chord } from './keybindings'
import type { ResolvedChord } from './resolved-keybinding'
import type { OperatingSystem } from '../platform/platform'

import { ResolvedKeybinding } from './resolved-keybinding'

export class BaseResolvedKeybinding<T extends Chord> extends ResolvedKeybinding {
  protected readonly _os: OperatingSystem
  protected readonly _chords: readonly T[]

  constructor(os: OperatingSystem, chords: readonly T[]) {
    super()
    this._os = os
    this._chords = chords
  }

  // Используется для отображения в UI (например "Ctrl+S")
  public getLabel(): string | null {
    return null
  }

  public getAriaLabel(): string | null {
    return this.getLabel()
  }

  public getElectronAccelerator(): string | null {
    return this.getLabel()
  }

  public getUserSettingsLabel(): string | null {
    const chords = this.getDispatchChords().filter((chord): chord is string => Boolean(chord))
    return chords.length ? chords.join(' ') : null
  }

  public hasMultipleChords(): boolean {
    return this._chords.length > 1
  }

  public getChords(): ResolvedChord[] {
    // Это нужно только если ты строишь сложный UI редактора хоткеев
    // Пока можно вернуть заглушки
    return []
  }

  protected _getChordDispatch(chord: T): string | null {
    return String(chord)
  }

  // Возвращает массив строк типа ["ctrl+KeyS"]
  public getDispatchChords(): (string | null)[] {
    return this._chords.map(chord => this._getChordDispatch(chord))
  }
}
