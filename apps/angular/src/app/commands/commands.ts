import { inject, Injectable, InjectionToken } from '@angular/core'
import type { IDisposable } from '../shared/core/disposable'

export type CommandHandler = (...args: any[]) => void

interface ICommand {
  id: string
  handler: CommandHandler
}

export interface ICommandRegistry {
  registerCommand: ((id: ICommand['id'], handler: ICommand['handler']) => IDisposable)
  getCommand: (id: string) => ICommand | undefined
}

@Injectable({
  providedIn: 'root',
})
export class CommandRegistry implements ICommandRegistry {
  private _commands = new Map<string, ICommand>()

  registerCommand(id: ICommand['id'], handler: ICommand['handler']): IDisposable {
    if (this._commands.has(id)) {
      console.warn(`Command ${id} is already registered!`)
      return {
        dispose: () => { },
      }
    }

    this._commands.set(id, { id, handler })

    return {
      dispose: () => {
        this._commands.delete(id)
      },
    }
  }

  getCommand(id: string) {
    const list = this._commands.get(id)
    if (!list) {
      return undefined
    }
    return list
  }
}


export const ICommandRegistry = new InjectionToken<ICommandRegistry>("ICommandRegistry", {
  providedIn: "root",
  factory: () => inject(CommandRegistry)
})
