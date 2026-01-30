/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';

import { Disposable } from '~/common/core/disposable';
import { ICommandRegistry } from './commands';
import { Logger } from '~/logger';

export interface ICommandService {
  executeCommand: <R = unknown>(
    commandId: string,
    ...args: unknown[]
  ) => Promise<R | undefined>;
}

export const ICommandService = new InjectionToken<ICommandService>(
  'ICommandService',
  {
    providedIn: 'root',
    factory: () => inject(CommandService),
  },
);

@Injectable({
  providedIn: 'root',
})
export class CommandService
  extends Disposable
  implements ICommandService, OnDestroy
{
  private readonly commandRegistry: ICommandRegistry = inject(ICommandRegistry);
  private _logger: Logger = inject(Logger);
  protected _logging: boolean;

  constructor() {
    super();
    this._logging = false;
  }

  public toggleLogging(): boolean {
    this._logging = !this._logging;
    return this._logging;
  }

  protected _log(str: string, payload?: Record<string, unknown>): void {
    if (this._logging) {
      this._logger.info(`[CommandService]: ${str}`, {
        scope: 'CommandService',
        payload: payload,
      });
    }
  }

  async executeCommand<T>(id: string, ...args: unknown[]): Promise<T> {
    this._log(`Command with ${id} executing...`, { args });
    return this._tryExecuteCommand(id, args);
  }

  private _tryExecuteCommand(id: string, args: unknown[]): Promise<any> {
    const command = this.commandRegistry.getCommand(id);
    if (!command) {
      return Promise.reject(new Error(`command '${id}' not found`));
    }
    try {
      const result = command.handler(...args);
      return Promise.resolve(result);
    } catch (err) {
      return Promise.reject(
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }

  public override dispose(): void {
    super.dispose();
  }

  public ngOnDestroy(): void {
    this.dispose();
  }
}
