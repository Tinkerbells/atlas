/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { OperatingSystem } from '../platform/platform'
import type { Keybinding, KeyCodeChord } from './keybindings'

import { KeyCode } from './key-codes'
import { BaseResolvedKeybinding } from './base-resolved-keybinding'
import { toEmptyArrayIfContainsNull } from './resolved-keybinding-item'

/**
 * Do not instantiate. Use KeybindingService to get a ResolvedKeybinding seeded with information about the current kb layout.
 */
export class USLayoutResolvedKeybinding extends BaseResolvedKeybinding<KeyCodeChord> {
  constructor(chords: KeyCodeChord[], os: OperatingSystem) {
    super(os, chords)
  }

  protected _isWYSIWYG(): boolean {
    return true
  }

  protected _getChordDispatch(chord: KeyCodeChord): string | null {
    return USLayoutResolvedKeybinding.getDispatchStr(chord)
  }

  public static getDispatchStr(chord: KeyCodeChord): string | null {
    if (chord.isModifierKey()) {
      return null
    }
    let result = ''

    if (chord.ctrlKey) {
      result += 'ctrl+'
    }
    if (chord.shiftKey) {
      result += 'shift+'
    }
    if (chord.altKey) {
      result += 'alt+'
    }
    if (chord.metaKey) {
      result += 'meta+'
    }
    result += KeyCode[chord.code]

    return result
  }

  public static resolveKeybinding(keybinding: Keybinding, os: OperatingSystem): USLayoutResolvedKeybinding[] {
    const chords: KeyCodeChord[] = toEmptyArrayIfContainsNull(keybinding.chords)
    if (chords.length > 0) {
      return [new USLayoutResolvedKeybinding(chords, os)]
    }
    return []
  }
}
