import { commandRegistry } from './commands'
import { keybindingRegistry } from './keybindings'

interface IDisposable {
  dispose: () => void
}

export class KeybindingService implements IDisposable {
  private currentContext: string = 'global'

  private readonly _keydownHandler = (e: KeyboardEvent) => {
    const keyString = this.resolveKey(e)
    if (!keyString)
      return

    const commandId = keybindingRegistry.findCommand(keyString, this.currentContext)

    if (commandId) {
      e.preventDefault()
      e.stopPropagation()
      console.log(`Executing ${commandId} via ${keyString}`)
      commandRegistry.execute(commandId)
    }
  }

  constructor() {
    window.addEventListener('keydown', this._keydownHandler)
  }

  setContext(context: string) {
    this.currentContext = context
  }

  dispose() {
    window.removeEventListener('keydown', this._keydownHandler)
    console.log('KeybindingService disposed: Listener removed')
  }

  private resolveKey(e: KeyboardEvent): string | null {
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key))
      return null
    const parts: string[] = []
    if (e.ctrlKey)
      parts.push('Ctrl')
    if (e.metaKey)
      parts.push('Cmd')
    if (e.altKey)
      parts.push('Alt')
    if (e.shiftKey)
      parts.push('Shift')
    parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
    return parts.join('+')
  }
}
