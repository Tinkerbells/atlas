import type { Keybinding } from './keybindings'
import type { IDisposable } from '../lifecycle/dispose'
import type { ContextKeyExpression } from '../context/parser'

import { decodeKeybinding } from './keybindings'
import { DisposableStore } from '../lifecycle/dispose'
import { OperatingSystem, OS } from '../platform/platform'

export interface IKeybindings {
  primary?: string
  secondary?: string[]
  win?: {
    primary: string
    secondary?: string[]
  }
  linux?: {
    primary: string
    secondary?: string[]
  }
  mac?: {
    primary: string
    secondary?: string[]
  }
}

/*
 * То, что передается на вход в registry (сырое правило)
 */
export interface IKeybindingRule extends IKeybindings {
  // NOTE: Id команды, в будущем лучше все подвизать под один тип CommandId
  id: string
  weight: number
  args?: any
  when: ContextKeyExpression | null | undefined
}

/*
 * Конечный item работы registry, обработанный resolver
 */
export interface IKeybindingItem {
  keybinding: Keybinding | null
  command: string | null
  commandArgs?: any
  when: ContextKeyExpression | null | undefined
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
  registerKeybindingRule: (rule: IKeybindingRule) => IDisposable
}

export class KeybindingsRegistryImpl implements IKeybindingsRegistry {
  // TODO: пока используем array O(N), однако для оптимизации лучше LinkedList O(1)
  private _coreKeybindings: IKeybindingItem[]
  private _cachedKeybindings: IKeybindingItem[] | null

  constructor() {
    this._coreKeybindings = []
    this._cachedKeybindings = null
  }

  private static bindToCurrentPlatform(kb: IKeybindings): { primary?: string, secondary?: string[] } {
    if (OS === OperatingSystem.Windows && kb.win)
      return kb.win
    if (OS === OperatingSystem.Macintosh && kb.mac)
      return kb.mac
    if (kb.linux)
      return kb.linux
    return kb
  }

  public getDefaultKeybindings() {
    if (!this._cachedKeybindings) {
      this._cachedKeybindings = this._coreKeybindings.sort(sorter)
    }
    // Создает копию массива, чтобы защитить кэш от внешних воздействий
    return this._cachedKeybindings.slice(0)
  }

  public registerKeybindingRule(rule: IKeybindingRule): IDisposable {
    const actualKb = KeybindingsRegistryImpl.bindToCurrentPlatform(rule)

    const result = new DisposableStore()

    // primary
    if (actualKb.primary) {
      const kb = decodeKeybinding(actualKb.primary)
      if (kb) {
        result.add(this._registerDefaultKeybinding(kb, rule.id, rule.args, rule.weight, 0, rule.when))
      }
    }

    // secondary
    if (actualKb.secondary) {
      for (let i = 0; i < actualKb.secondary.length; i++) {
        const kb = decodeKeybinding(actualKb.secondary[i])
        if (kb) {
          // weight2 уходит в минус, чтобы первичный был приоритетнее
          result.add(this._registerDefaultKeybinding(kb, rule.id, rule.args, rule.weight, -i - 1, rule.when))
        }
      }
    }
    return result
  }

  private _registerDefaultKeybinding(
    keybinding: Keybinding,
    commandId: string,
    commandArgs: any,
    weight1: number,
    weight2: number,
    when: ContextKeyExpression | null | undefined,
  ): IDisposable {
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

    return {
      dispose: () => remove(),
    }
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

export const keybindingsRegistry: IKeybindingsRegistry = new KeybindingsRegistryImpl()
