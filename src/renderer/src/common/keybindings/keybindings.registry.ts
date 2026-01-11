import type { Keybinding } from './keybindings'
import type { WhenExpression } from '../helpers/context/context'

import { decodeKeybinding } from './keybindings'

/*
 * То, что передается на вход в registry (сырое правило)
 */
export interface IKeybindingRule {
  // NOTE: Id команды, в будущем лучше все подвизать под один тип CommandId
  id: string
  keybinding: string[]
  weight: number
  args?: any
  when: WhenExpression | null | undefined
}

/*
 * Конечный item работы registry, обработанный resolver
 */
export interface IKeybindingItem {
  keybinding: Keybinding | null
  command: string | null
  commandArgs?: any
  when: WhenExpression | null | undefined
  weight1: number
  weight2: number
}

/*
 * Registry отвечает за:
 * 1. За регистрацию нового IKeybindingRule -> IKeybindingItem
*/
export interface IKeybindingsRegistry {
  // registerCommandAndKeybindingRule - должен также вывызать CommandRegistry
  getDefaultKeybindings: () => IKeybindingItem[]
  // Тут возвращается функция удаления команды, чтобы было удобно при необходимости удалить ее
  registerKeybindingRule: (rule: IKeybindingRule) => () => void
}

export class KeybindingRegistry implements IKeybindingsRegistry {
  // TODO: пока используем array O(N), однако для оптимизации лучше LinkedList O(1)
  private _coreKeybindings: IKeybindingItem[]
  private _cachedKeybindings: IKeybindingItem[] | null

  constructor() {
    this._coreKeybindings = []
    this._cachedKeybindings = null
  }

  public getDefaultKeybindings() {
    if (!this._cachedKeybindings) {
      this._cachedKeybindings = this._coreKeybindings.sort(sorter)
    }
    // Создает копию массива, чтобы защитить кэш от внешних воздействий
    return this._cachedKeybindings.slice(0)
  }

  public registerKeybindingRule(rule: IKeybindingRule) {
    const keybinding = decodeKeybinding(rule.keybinding)
    return this._registerDefaultKeybinding(keybinding, rule.id, rule.args, rule.weight, 0, rule.when)
  }

  private _registerDefaultKeybinding(
    keybinding: Keybinding,
    commandId: string,
    commandArgs: any,
    weight1: number,
    weight2: number,
    when: WhenExpression | null | undefined,
  ) {
    const item: IKeybindingItem = {
      keybinding,
      command: commandId,
      commandArgs,
      when,
      weight1,
      weight2,
    }

    this._coreKeybindings.push(item)

    this._cachedKeybindings = null

    const remove = () => {
      const index = this._coreKeybindings.indexOf(item)
      if (index !== -1) {
        this._coreKeybindings.splice(index, 1)
      }
      this._cachedKeybindings = null
    }

    return remove
  }
}

function sorter(a: IKeybindingItem, b: IKeybindingItem): number {
  if (a.weight1 !== b.weight1) {
    return a.weight1 - b.weight1
  }
  if (a.command && b.command) {
    if (a.command < b.command) {
      return -1
    }
    if (a.command > b.command) {
      return 1
    }
  }
  return a.weight2 - b.weight2
}
