export type CommandHandler = (...args: any[]) => void

interface ICommand {
  id: string
  handler: CommandHandler
}

class CommandRegistry {
  private _commands = new Map<string, ICommand>()

  // Регистрируем команду
  registerCommand(id: ICommand['id'], handler: ICommand['handler']) {
    if (this._commands.has(id)) {
      console.warn(`Command ${id} is already registered!`)
      // Пока заглушка для ts
      return () => { }
    }

    this._commands.set(id, { id, handler })

    // Возвращаем функцию для отписки (Pattern Disposable как в VS Code)
    return () => {
      this._commands.delete(id)
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
