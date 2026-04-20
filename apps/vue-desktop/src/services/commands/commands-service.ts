import { createDecorator } from '@atlas/di';
import { Disposable } from '@atlas/shared';
import { ICommandRegistry } from './commands';
import { ILogger } from '../logger/logger';

export interface ICommandService {
  executeCommand: <R = unknown>(
    commandId: string,
    ...args: unknown[]
  ) => Promise<R | undefined>;
}

export const ICommandService = createDecorator<ICommandService>('commandService');

export class CommandService extends Disposable implements ICommandService {
  protected _logging: boolean;

  constructor(
    @ICommandRegistry private _commandRegistry: ICommandRegistry,
    @ILogger private _logger: ILogger,
  ) {
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
    const command = this._commandRegistry.getCommand(id);
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
}
