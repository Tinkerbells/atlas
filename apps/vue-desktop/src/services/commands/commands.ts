import type { IDisposable } from "@atlas/shared";

import { createDecorator } from "@atlas/di";

import { ILogger } from "../logger/logger";

export type CommandHandler = (...args: any[]) => void;

interface ICommand {
  id: string;
  handler: CommandHandler;
}

export interface ICommandRegistry {
  registerCommand: (
    id: ICommand["id"],
    handler: ICommand["handler"],
  ) => IDisposable;
  getCommand: (id: string) => ICommand | undefined;
}

export const ICommandRegistry = createDecorator<ICommandRegistry>("commandRegistry");

export class CommandRegistry implements ICommandRegistry {
  private _commands = new Map<string, ICommand>();

  constructor(@ILogger private _logger: ILogger) {}

  registerCommand(
    id: ICommand["id"],
    handler: ICommand["handler"],
  ): IDisposable {
    if (this._commands.has(id)) {
      this._logger.warning(`Command ${id} is already registered!`, {
        scope: "CommandRegistry",
      });
      return { dispose: () => {} };
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
