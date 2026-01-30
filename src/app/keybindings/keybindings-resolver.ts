/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IContext } from '~/context';
import type { ContextKeyExpression } from '~/context';
import type { ResolvedKeybindingItem } from './resolved-keybinding-item';

export enum ResultKind {
  NoMatchingKb,
  MoreChordsNeeded,
  KbFound,
}

export type ResolutionResult =
  | { kind: ResultKind.NoMatchingKb }
  | { kind: ResultKind.MoreChordsNeeded }
  | {
      kind: ResultKind.KbFound;
      commandId: string | null;
      commandArgs: any;
      isBubble: boolean;
    };

export const NoMatchingKb: ResolutionResult = { kind: ResultKind.NoMatchingKb };
export const MoreChordsNeeded: ResolutionResult = {
  kind: ResultKind.MoreChordsNeeded,
};
function KbFound(
  commandId: string | null,
  commandArgs: any,
  isBubble: boolean,
): ResolutionResult {
  return { kind: ResultKind.KbFound, commandId, commandArgs, isBubble };
}

export class KeybindingResolver {
  private readonly _defaultKeybindings: ResolvedKeybindingItem[];
  private readonly _keybindings: ResolvedKeybindingItem[];
  private readonly _defaultBoundCommands: Map<string, boolean>;
  private readonly _map: Map<string, ResolvedKeybindingItem[]>;
  private readonly _lookupMap: Map<string, ResolvedKeybindingItem[]>;

  constructor(
    defaultKeybindings: ResolvedKeybindingItem[],
    overrides: ResolvedKeybindingItem[],
  ) {
    this._defaultKeybindings = defaultKeybindings;
    this._map = new Map<string, ResolvedKeybindingItem[]>();
    this._lookupMap = new Map<string, ResolvedKeybindingItem[]>();
    this._defaultBoundCommands = new Map<string, boolean>();

    for (const defaultKeybinding of defaultKeybindings) {
      const command = defaultKeybinding.command;
      if (command && command.charAt(0) !== '-') {
        this._defaultBoundCommands.set(command, true);
      }
    }

    this._keybindings = [...this._defaultKeybindings, ...overrides];

    for (let i = 0, len = this._keybindings.length; i < len; i++) {
      const k = this._keybindings[i];
      if (k.chords.length === 0) {
        continue;
      }

      this._addKeyPress(k.chords[0], k);
    }
  }

  private _addKeyPress(keypress: string, item: ResolvedKeybindingItem): void {
    const list = this._map.get(keypress);
    if (!list) {
      this._map.set(keypress, [item]);
    } else {
      list.push(item);
    }
    this._addToLookupMap(item);
  }

  private _addToLookupMap(item: ResolvedKeybindingItem): void {
    if (!item.command) {
      return;
    }

    let arr = this._lookupMap.get(item.command);
    if (typeof arr === 'undefined') {
      arr = [item];
      this._lookupMap.set(item.command, arr);
    } else {
      arr.push(item);
    }
  }

  private _removeFromLookupMap(item: ResolvedKeybindingItem): void {
    if (!item.command) {
      return;
    }
    const arr = this._lookupMap.get(item.command);
    if (typeof arr === 'undefined') {
      return;
    }
    for (let i = 0, len = arr.length; i < len; i++) {
      if (arr[i] === item) {
        arr.splice(i, 1);
        return;
      }
    }
  }

  public resolve(
    context: IContext,
    currentChords: string[],
    keypress: string,
  ): ResolutionResult {
    const pressedChords = [...currentChords, keypress];

    console.log('pressedChords:', pressedChords);

    const kbCandidates = this._map.get(pressedChords[0]);
    if (kbCandidates === undefined) {
      return NoMatchingKb;
    }

    let lookupMap: ResolvedKeybindingItem[] | null = null;

    if (pressedChords.length < 2) {
      lookupMap = kbCandidates;
    } else {
      lookupMap = [];
      for (let i = 0, len = kbCandidates.length; i < len; i++) {
        const candidate = kbCandidates[i];

        if (pressedChords.length > candidate.chords.length) {
          continue;
        }

        let prefixMatches = true;
        for (let j = 1; j < pressedChords.length; j++) {
          if (candidate.chords[j] !== pressedChords[j]) {
            prefixMatches = false;
            break;
          }
        }
        if (prefixMatches) {
          lookupMap.push(candidate);
        }
      }
    }

    const result = this._findCommand(context, lookupMap);
    if (!result) {
      return NoMatchingKb;
    }

    console.log('resolve result:', {
      pressedChordsLength: pressedChords.length,
      resultChordsLength: result.chords.length,
      resultChords: result.chords,
      command: result.command,
    });

    if (pressedChords.length < result.chords.length) {
      console.log(
        'MoreChordsNeeded',
        pressedChords.length,
        result.chords.length,
      );
      return MoreChordsNeeded;
    }

    return KbFound(result.command, result.commandArgs, result.bubble);
  }

  private _findCommand(
    context: IContext,
    matches: ResolvedKeybindingItem[],
  ): ResolvedKeybindingItem | null {
    for (let i = matches.length - 1; i >= 0; i--) {
      const k = matches[i];

      if (!KeybindingResolver._contextMatchesRules(context, k.when)) {
        continue;
      }

      return k;
    }

    return null;
  }

  private static _contextMatchesRules(
    context: IContext,
    rules: ContextKeyExpression | null | undefined,
  ): boolean {
    if (!rules) {
      return true;
    }

    return rules.evaluate(context);
  }

  public getDefaultKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._defaultKeybindings;
  }

  public getKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._keybindings;
  }

  public getDefaultBoundCommands(): Map<string, boolean> {
    return this._defaultBoundCommands;
  }

  public lookupKeybindings(commandId: string): ResolvedKeybindingItem[] {
    const items = this._lookupMap.get(commandId);
    if (typeof items === 'undefined' || items.length === 0) {
      return [];
    }

    const result: ResolvedKeybindingItem[] = [];
    let resultLen = 0;
    for (let i = items.length - 1; i >= 0; i--) {
      result[resultLen++] = items[i];
    }
    return result;
  }
}
