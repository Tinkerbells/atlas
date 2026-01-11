// keybindings.ts

export interface KeybindingRule {
  key: string // Например "Ctrl+S", "Cmd+Shift+P"
  commandId: string // Какую команду запустить
  when?: string // Контекст: "filesFocus", "inputFocus" и т.д.
}

class KeybindingRegistry {
  private rules: KeybindingRule[] = []

  register(rule: KeybindingRule) {
    this.rules.push(rule)
    // Опять же, возвращаем диспоузер
    return () => {
      this.rules = this.rules.filter(r => r !== rule)
    }
  }

  // Поиск команды по нажатой комбинации и текущему контексту
  findCommand(key: string, currentContext: string): string | null {
    // Ищем правило:
    // 1. Клавиши совпадают
    // 2. Либо контекст не задан (глобальный), либо совпадает с текущим
    const match = this.rules.find((rule) => {
      const keyMatch = rule.key.toLowerCase() === key.toLowerCase()
      const contextMatch = !rule.when || rule.when === currentContext
      return keyMatch && contextMatch
    })

    return match ? match.commandId : null
  }
}

export const keybindingRegistry = new KeybindingRegistry()
