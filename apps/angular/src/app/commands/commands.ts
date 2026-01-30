/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { inject, Injectable, InjectionToken } from '@angular/core';
import type { IDisposable } from '~/common/core/disposable';
import { Logger } from '~/logger';

export type CommandHandler = (...args: any[]) => void;

interface ICommand {
  id: string;
  handler: CommandHandler;
}

export interface ICommandRegistry {
  registerCommand: (
    id: ICommand['id'],
    handler: ICommand['handler'],
  ) => IDisposable;
  getCommand: (id: string) => ICommand | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class CommandRegistry implements ICommandRegistry {
  private _commands = new Map<string, ICommand>();
  private readonly logger: Logger = inject(Logger);

  registerCommand(
    id: ICommand['id'],
    handler: ICommand['handler'],
  ): IDisposable {
    if (this._commands.has(id)) {
      this.logger.warning(`Command ${id} is already registered!`, {
        scope: 'CommandRegistry',
      });
      return {
        dispose: () => {},
      };
    }

    this._commands.set(id, { id, handler });

    return {
      dispose: () => {
        this._commands.delete(id);
      },
    };
  }

  getCommand(id: string) {
    const list = this._commands.get(id);
    if (!list) {
      return undefined;
    }
    return list;
  }
}

export const ICommandRegistry = new InjectionToken<ICommandRegistry>(
  'ICommandRegistry',
  {
    providedIn: 'root',
    factory: () => inject(CommandRegistry),
  },
);
