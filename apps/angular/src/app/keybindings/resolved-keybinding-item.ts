/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ContextKeyExpression } from '~/context';
import type { ResolvedKeybinding } from './resolved-keybinding';

export class ResolvedKeybindingItem {
  _resolvedKeybindingItemBrand: void = undefined;

  public readonly resolvedKeybinding: ResolvedKeybinding | undefined;
  public readonly chords: string[];
  public readonly bubble: boolean;
  public readonly command: string | null;
  public readonly commandArgs: any;
  public readonly when: ContextKeyExpression | undefined;
  public readonly isDefault: boolean;

  constructor(
    resolvedKeybinding: ResolvedKeybinding | undefined,
    command: string | null,
    commandArgs: any,
    when: ContextKeyExpression | undefined,
    isDefault: boolean,
  ) {
    this.resolvedKeybinding = resolvedKeybinding;
    if (resolvedKeybinding) {
      this.chords = toEmptyArrayIfContainsNull(
        resolvedKeybinding.getDispatchChords(),
      );
    } else {
      this.chords = [];
    }
    this.bubble = command ? command.charAt(0) === '^' : false;
    this.command = this.bubble ? command!.substr(1) : command;
    this.commandArgs = commandArgs;
    this.when = when;
    this.isDefault = isDefault;
  }
}

export function toEmptyArrayIfContainsNull<T>(arr: (T | null)[]): T[] {
  const result: T[] = [];
  for (let i = 0, len = arr.length; i < len; i++) {
    const element = arr[i];
    if (!element) {
      return [];
    }
    result.push(element);
  }
  return result;
}
