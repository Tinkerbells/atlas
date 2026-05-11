import { Disposable } from "@core/base";
import { ILogger } from "@platform/logger/common/logger";
import { createDecorator, InstantiationType, registerSingleton } from "@core/di";

import { ICommandRegistry } from "./commands";

export interface ICommandService {
  readonly _serviceBrand: undefined;

  executeCommand: <R = unknown>(
    commandId: string,
    ...args: unknown[]
  ) => Promise<R | undefined>;
}

export const ICommandService = createDecorator<ICommandService>("commandService");

export class CommandService extends Disposable implements ICommandService {
  declare readonly _serviceBrand: undefined;

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
        scope: "CommandService",
        payload,
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
    }
    catch (err) {
      return Promise.reject(
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }
}

registerSingleton(ICommandService, CommandService, InstantiationType.Eager);
