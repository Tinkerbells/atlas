/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class ResolvedChord {
  constructor(
    public readonly ctrlKey: boolean,
    public readonly shiftKey: boolean,
    public readonly altKey: boolean,
    public readonly metaKey: boolean,
    public readonly keyLabel: string | null,
    public readonly keyAriaLabel: string | null,
  ) { }
}

export abstract class ResolvedKeybinding {
  public abstract getLabel(): string | null
  public abstract getAriaLabel(): string | null
  public abstract getElectronAccelerator(): string | null
  public abstract getUserSettingsLabel(): string | null
  public abstract hasMultipleChords(): boolean
  public abstract getChords(): ResolvedChord[]
  public abstract getDispatchChords(): (string | null)[]
}
