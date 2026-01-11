export type CommandHandler = (...args: any[]) => void

interface ICommand {
  id: string
  handler: CommandHandler
}

class CommandRegistry {
  private commands = new Map<string, ICommand>()

  // Регистрируем команду
  register(id: ICommand['id'], handler: ICommand['handler']) {
    if (this.commands.has(id)) {
      console.warn(`Command ${id} is already registered!`)
      // Пока заглушка для ts
      return () => { }
    }

    this.commands.set(id, { id, handler })

    // Возвращаем функцию для отписки (Pattern Disposable как в VS Code)
    return () => {
      this.commands.delete(id)
    }
  }

  // Выполняем команду
  execute(id: string, ...args: any[]) {
    const command = this.commands.get(id)
    if (!command) {
      console.error(`Command ${id} not found`)
      return
    }
    command.handler(...args)
  }

  // Проверка для UI (например, чтобы знать, дизейблить ли кнопку)
  has(id: string): boolean {
    return this.commands.has(id)
  }
}

export const commandRegistry = new CommandRegistry()
