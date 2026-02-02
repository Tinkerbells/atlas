/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Keybinding } from './keybindings';
import type { IDisposable } from '~/common/core/disposable';
import type { ContextKeyExpression } from '~/context';

import { decodeKeybinding } from './keybindings';
import { DisposableStore } from '~/common/core/disposable';
import { OperatingSystem, OS } from '~/platform';
import { inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';
import { Logger } from '~/logger/logger';
import { USLayoutResolvedKeybinding } from './us-layout-resolved-keybinding';
import { isReservedBrowserKeybinding } from './reserved-keybindings';

export interface IKeybindings {
  primary?: number;
  secondary?: number[];
  win?: {
    primary: number;
    secondary?: number[];
  };
  linux?: {
    primary: number;
    secondary?: number[];
  };
  mac?: {
    primary: number;
    secondary?: number[];
  };
}

export interface IKeybindingRule extends IKeybindings {
  id: string;
  weight: number;
  args?: any;
  when: ContextKeyExpression | null | undefined;
}

export interface IKeybindingItem {
  keybinding: Keybinding | null;
  command: string | null;
  commandArgs?: any;
  when: ContextKeyExpression | null | undefined;
  weight1: number;
  weight2: number;
}

export interface IKeybindingsRegistry {
  getDefaultKeybindings: () => IKeybindingItem[];
  registerKeybindingRule: (rule: IKeybindingRule) => IDisposable;
}

export const IKeybindingsRegistry = new InjectionToken<IKeybindingsRegistry>(
  'IKeybindingsRegistry ',
  {
    providedIn: 'root',

    factory: () => inject(KeybindingsRegistryImpl),
  },
);

@Injectable({
  providedIn: 'root',
})
export class KeybindingsRegistryImpl
  implements IKeybindingsRegistry, OnDestroy
{
  private _coreKeybindings: IKeybindingItem[];
  private _cachedKeybindings: IKeybindingItem[] | null;
  protected _logger: Logger = inject(Logger);

  constructor() {
    this._coreKeybindings = [];
    this._cachedKeybindings = null;
  }

  private static bindToCurrentPlatform(kb: IKeybindings): {
    primary?: number;
    secondary?: number[];
  } {
    if (OS === OperatingSystem.Windows && kb.win) return kb.win;
    if (OS === OperatingSystem.Macintosh && kb.mac) return kb.mac;
    if (kb.linux) return kb.linux;
    return kb;
  }

  public getDefaultKeybindings() {
    if (!this._cachedKeybindings) {
      this._cachedKeybindings = this._coreKeybindings.sort(sorter);
    }
    return this._cachedKeybindings.slice(0);
  }

  public registerKeybindingRule(rule: IKeybindingRule): IDisposable {
    const actualKb = KeybindingsRegistryImpl.bindToCurrentPlatform(rule);

    const result = new DisposableStore();

    if (actualKb.primary) {
      const kb = decodeKeybinding(actualKb.primary, OS);
      if (kb) {
        this._checkForReservedKeybinding(kb, OS, rule.id);
        result.add(
          this._registerDefaultKeybinding(
            kb,
            rule.id,
            rule.args,
            rule.weight,
            0,
            rule.when,
          ),
        );
      }
    }

    if (actualKb.secondary) {
      for (let i = 0; i < actualKb.secondary.length; i++) {
        const kb = decodeKeybinding(actualKb.secondary[i], OS);
        if (kb) {
          this._checkForReservedKeybinding(kb, OS, rule.id);
          result.add(
            this._registerDefaultKeybinding(
              kb,
              rule.id,
              rule.args,
              rule.weight,
              -i - 1,
              rule.when,
            ),
          );
        }
      }
    }
    return result;
  }

  private _checkForReservedKeybinding(
    keybinding: Keybinding,
    os: OperatingSystem,
    commandId: string,
  ): void {
    const resolvedKeybindings = USLayoutResolvedKeybinding.resolveKeybinding(
      keybinding,
      os,
    );
    if (resolvedKeybindings.length > 0) {
      const dispatchStr = resolvedKeybindings[0].getDispatchChords()[0];
      if (dispatchStr && isReservedBrowserKeybinding(dispatchStr)) {
        this._logger.warning(
          `Keybinding "${dispatchStr}" for command "${commandId}" may conflict with browser shortcuts`,
          { scope: 'KeybindingsRegistry' },
        );
      }
    }
  }

  private _registerDefaultKeybinding(
    keybinding: Keybinding,
    commandId: string,
    commandArgs: any,
    weight1: number,
    weight2: number,
    when: ContextKeyExpression | null | undefined,
  ): IDisposable {
    const item: IKeybindingItem = {
      keybinding,
      command: commandId,
      commandArgs,
      when,
      weight1,
      weight2,
    };

    this._coreKeybindings.push(item);

    this._cachedKeybindings = null;

    const remove = () => {
      const index = this._coreKeybindings.indexOf(item);
      if (index !== -1) {
        this._coreKeybindings.splice(index, 1);
      }
      this._cachedKeybindings = null;
    };

    return {
      dispose: () => remove(),
    };
  }

  public ngOnDestroy(): void {
    this._coreKeybindings = [];
    this._cachedKeybindings = null;
  }
}

// Sorting/deduplication logic doesn't work correctly for duplicate keybindings
function sorter(a: IKeybindingItem, b: IKeybindingItem): number {
  if (a.weight1 !== b.weight1) {
    return a.weight1 - b.weight1;
  }
  if (a.command && b.command) {
    if (a.command < b.command) {
      return -1;
    }
    if (a.command > b.command) {
      return 1;
    }
  }
  return a.weight2 - b.weight2;
}
