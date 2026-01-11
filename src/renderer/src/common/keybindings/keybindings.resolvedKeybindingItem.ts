import type { IKeybindingItem } from './keybindings.registry'
import type { WhenExpression } from '../helpers/context/context'

export class ResolvedKeybindingItem {
  _resolvedKeybindingItemBrand: void = undefined

  public readonly resolvedKeybinding: IKeybindingItem | undefined
  public readonly chords: string[]
  public readonly bubble: boolean
  public readonly command: string | null
  public readonly commandArgs: any
  public readonly when: WhenExpression | undefined
  public readonly isDefault: boolean

  constructor(resolvedKeybinding: IKeybindingItem | undefined, command: string | null, commandArgs: any, when: WhenExpression | undefined, isDefault: boolean) {
    this.resolvedKeybinding = resolvedKeybinding
    // WARN: в оригинале есть проверка нулевых значений
    this.chords = resolvedKeybinding?.keybinding?.chords ?? []
    // if (resolvedKeybinding && this.chords.length === 0) {
    //   // handle possible single modifier chord keybindings
    //   this.chords = toEmptyArrayIfContainsNull(resolvedKeybinding.getSingleModifierDispatchChords())
    // }
    this.bubble = (command ? command.charAt(0) === '-' : false)
    this.command = this.bubble ? command!.substr(1) : command
    this.commandArgs = commandArgs
    this.when = when
    this.isDefault = isDefault
  }
}
