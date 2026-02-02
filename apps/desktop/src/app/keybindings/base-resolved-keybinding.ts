/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Chord } from './keybindings';
import type { ResolvedChord } from './resolved-keybinding';
import type { OperatingSystem } from '~/platform';

import { ResolvedKeybinding } from './resolved-keybinding';
import { ScanCodeUtils } from './scan-code';

export class BaseResolvedKeybinding<
  T extends Chord = Chord,
> extends ResolvedKeybinding {
  protected readonly _os: OperatingSystem;
  protected readonly _chords: readonly T[];

  constructor(os: OperatingSystem, chords: readonly T[]) {
    super();
    this._os = os;
    this._chords = chords;
  }

  public getLabel(): string | null {
    return null;
  }

  public getAriaLabel(): string | null {
    return this.getLabel();
  }

  public getElectronAccelerator(): string | null {
    return this.getLabel();
  }

  public getUserSettingsLabel(): string | null {
    const chords = this.getDispatchChords().filter((chord): chord is string =>
      Boolean(chord),
    );
    return chords.length ? chords.join(' ') : null;
  }

  public hasMultipleChords(): boolean {
    return this._chords.length > 1;
  }

  public getChords(): ResolvedChord[] {
    return [];
  }

  protected _getChordDispatch(chord: T): string | null {
    if (!chord.code) {
      return null;
    }
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

  public getDispatchChords(): (string | null)[] {
    return this._chords.map((chord) => this._getChordDispatch(chord));
  }
}
