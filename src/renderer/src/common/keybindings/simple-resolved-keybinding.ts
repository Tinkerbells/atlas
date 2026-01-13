import type { ResolvedChord } from './resolved-keybinding'

import { ResolvedKeybinding } from './resolved-keybinding'

export class SimpleResolvedKeybinding extends ResolvedKeybinding {
  private readonly _dispatchParts: string[]

  constructor(dispatchParts: string[]) {
    super()
    this._dispatchParts = dispatchParts
  }

  // Используется для отображения в UI (например "Ctrl+S")
  public getLabel(): string | null {
    // Простая реализация: делаем первую букву заглавной
    return this._dispatchParts.map(p =>
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
    return this._dispatchParts.join(' ')
  }

  public isWYSIWYG(): boolean {
    return true
  }

  public hasMultipleChords(): boolean {
    return this._dispatchParts.length > 1
  }

  public getChords(): ResolvedChord[] {
    // Это нужно только если ты строишь сложный UI редактора хоткеев
    // Пока можно вернуть заглушки
    return []
  }

  // Возвращает массив строк типа ["ctrl+KeyS"]
  public getDispatchChords(): (string | null)[] {
    return this._dispatchParts
  }
}
