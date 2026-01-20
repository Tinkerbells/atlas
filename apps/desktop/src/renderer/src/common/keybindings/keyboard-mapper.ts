import type { OperatingSystem } from '../platform/platform'
import type { ResolvedKeybinding } from './resolved-keybinding'

import { Keybinding, KeyCodeChord, toKeyCode } from './keybindings'
import { USLayoutResolvedKeybinding } from './us-layout-resolved-keybinding'

export interface IKeyboardMapper {
  dumpDebugInfo: () => string
  resolveKeyboardEvent: (keyboardEvent: KeyboardEvent) => ResolvedKeybinding
  resolveKeybinding: (keybinding: Keybinding) => ResolvedKeybinding[]
}

export class KeyboardMapper implements IKeyboardMapper {
  constructor(
    // TODO: подумать надо ли
    // private readonly _mapAltGrToCtrlAlt: boolean,
    private readonly _OS: OperatingSystem,
  ) { }

  public dumpDebugInfo(): string {
    return 'FallbackKeyboardMapper dispatching on keyCode'
  }

  public resolveKeyboardEvent(e: KeyboardEvent): ResolvedKeybinding {
    // const ctrlKey = keyboardEvent.ctrlKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey)
    // const altKey = keyboardEvent.altKey || (this._mapAltGrToCtrlAlt && keyboardEvent.altGraphKey)
    const ctrlKey = e.ctrlKey
    const altKey = e.altKey
    const chord = new KeyCodeChord(
      ctrlKey,
      e.shiftKey,
      altKey,
      e.metaKey,
      toKeyCode(e.code),
    )
    const [result] = this.resolveKeybinding(new Keybinding([chord]))
    return result
  }

  public resolveKeybinding(keybinding: Keybinding): ResolvedKeybinding[] {
    return USLayoutResolvedKeybinding.resolveKeybinding(keybinding, this._OS)
  }
}

// TODO: в vscode тут имеется реализация CachedKeyboardMapper, позже потребуется для оптимизации
