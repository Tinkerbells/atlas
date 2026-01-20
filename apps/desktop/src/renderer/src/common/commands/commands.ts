import type { IDisposable } from '../lifecycle/dispose'

export type CommandHandler = (...args: any[]) => void

interface ICommand {
  id: string
  handler: CommandHandler
}

export interface ICommandRegistry {
  registerCommand: ((id: ICommand['id'], handler: ICommand['handler']) => IDisposable)
  getCommand: (id: string) => ICommand | undefined
}

class CommandRegistry implements ICommandRegistry {
  private _commands = new Map<string, ICommand>()

  // Регистрируем команду
  registerCommand(id: ICommand['id'], handler: ICommand['handler']): IDisposable {
    if (this._commands.has(id)) {
      console.warn(`Command ${id} is already registered!`)
      // Пока заглушка для ts
      return {
        dispose: () => { },
      }
    }

    this._commands.set(id, { id, handler })

    // Возвращаем функцию для отписки (Pattern Disposable как в VS Code)
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

export const commandsRegistry = new CommandRegistry()
