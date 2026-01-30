/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { OperatingSystem } from '~/platform';
import type { Keybinding, ScanCodeChord } from './keybindings';

import { BaseResolvedKeybinding } from './base-resolved-keybinding';
import { toEmptyArrayIfContainsNull } from './resolved-keybinding-item';
import { ScanCodeUtils } from './scan-code';

export class USLayoutResolvedKeybinding extends BaseResolvedKeybinding<ScanCodeChord> {
  constructor(chords: ScanCodeChord[], os: OperatingSystem) {
    super(os, chords);
  }

  protected _isWYSIWYG(): boolean {
    return true;
  }

  protected _getChordDispatch(chord: ScanCodeChord): string | null {
    if (chord.isModifierKey()) {
      return null;
    }
    return USLayoutResolvedKeybinding.getDispatchStr(chord);
  }

  public static getDispatchStr(chord: ScanCodeChord): string | null {
    // if (chord.isModifierKey()) {
    //   return null;
    // }
    let result = '';

    if (chord.ctrlKey) {
      result += 'ctrl+';
    }
    if (chord.shiftKey) {
      result += 'shift+';
    }
    if (chord.altKey) {
      result += 'alt+';
    }
    if (chord.metaKey) {
      result += 'meta+';
    }
    result += ScanCodeUtils.toString(chord.code);

    return result;
  }

  public static resolveKeybinding(
    keybinding: Keybinding,
    os: OperatingSystem,
  ): USLayoutResolvedKeybinding[] {
    const chords: ScanCodeChord[] = toEmptyArrayIfContainsNull(
      keybinding.chords,
    );
    if (chords.length > 0) {
      return [new USLayoutResolvedKeybinding(chords, os)];
    }
    return [];
  }
}
