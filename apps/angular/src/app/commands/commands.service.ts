import { inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';

import { Disposable } from '~/common/core/disposable';
import { ICommandRegistry } from './commands';

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

  constructor() {
    super();
  }

  async executeCommand<T>(id: string, ...args: unknown[]): Promise<T> {
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
      return Promise.reject(err);
    }
  }

  public override dispose(): void {
    super.dispose();
  }

  public ngOnDestroy(): void {
    this.dispose();
  }
}
