import type { IContext } from '../context/context'
import type { ContextKeyExpression } from '../context/parser'
import type { ResolvedKeybindingItem } from './resolved-keybinding-item.ts'

export enum ResultKind {
  /** Для данной последовательности аккордов не найдено ни одной привязки клавиш */
  NoMatchingKb,

  /** Существует несколько привязок клавиш, для которых данная последовательность аккордов является префиксом */
  MoreChordsNeeded,

  /** Найдена одна привязка клавиш, которую можно выполнить/вызвать */
  KbFound,
}

export type ResolutionResult = | { kind: ResultKind.NoMatchingKb }
  | { kind: ResultKind.MoreChordsNeeded }
  | {
    kind: ResultKind.KbFound
    commandId: string | null
    commandArgs: any
    // isBubble = false → перехватываем и preventDefault()
    // isBubble = true → не блокируем событие, браузер / DOM может его обработать дальше
    isBubble: boolean
  }

/*
 * Утилиты для удобной работы с результатом функции resolve
 */
export const NoMatchingKb: ResolutionResult = { kind: ResultKind.NoMatchingKb }
const MoreChordsNeeded: ResolutionResult = { kind: ResultKind.MoreChordsNeeded }
function KbFound(commandId: string | null, commandArgs: any, isBubble: boolean): ResolutionResult {
  return { kind: ResultKind.KbFound, commandId, commandArgs, isBubble }
}

/*
 * Resolver отвечает за:
 * 1. За слияние default keybindings и user overriders
 * 2. За проверку аккордов на соотвествие всем правилам
 * 3. Возвращает результат kind, говорящий сервису, что делать далее
*/
export class KeybindingResolver {
  private readonly _defaultKeybindings: ResolvedKeybindingItem[]
  private readonly _keybindings: ResolvedKeybindingItem[]
  private readonly _map: Map<string, ResolvedKeybindingItem[]> // первые нажатые chord's
  // private readonly _defaultBoundCommands: Map<string, boolean>
  constructor(
    // встроенные keybindings
    defaultKeybindings: ResolvedKeybindingItem[],
    // пользовательские keybindings
    overrides: ResolvedKeybindingItem[],
  ) {
    this._defaultKeybindings = defaultKeybindings
    this._map = new Map<string, ResolvedKeybindingItem[]>()

    // TODO: добавить логику удаления
    this._keybindings = [...this._defaultKeybindings, ...overrides]

    for (let i = 0, len = this._keybindings.length; i < len; i++) {
      const k = this._keybindings[i]
      if (k.chords.length === 0) {
        // нет привязанного хоткея
        continue
      }

      this._addKeyPress(k.chords[0], k)
    }
  }

  private _addKeyPress(keypress: string, item: ResolvedKeybindingItem): void {
    const list = this._map.get(keypress)
    if (!list) {
      this._map.set(keypress, [item])
    }
    else {
      list.push(item)
    }
  }

  public resolve(context: IContext, currentChords: string[], keypress: string): ResolutionResult {
    const pressedChords = [...currentChords, keypress]
    const kbCandidates = this._map.get(pressedChords[0])

    if (kbCandidates === undefined) {
      // Нет привязок с таким нулевым chords
      return NoMatchingKb
    }

    let lookupMap: ResolvedKeybindingItem[] | null = null

    // Если chord только один — кандидаты уже готовы.
    if (pressedChords.length < 2) {
      lookupMap = kbCandidates
    }
    else {
      // Fetch all chord bindings for `currentChords`
      lookupMap = []
      for (let i = 0, len = kbCandidates.length; i < len; i++) {
        const candidate = kbCandidates[i]

        if (pressedChords.length > candidate.chords.length) { // # of pressed chords can't be less than # of chords in a keybinding to invoke
          continue
        }

        let prefixMatches = true
        // Если совпал префикс — этот кандидат подходит и остаётся.
        for (let i = 1; i < pressedChords.length; i++) {
          if (candidate.chords[i] !== pressedChords[i]) {
            prefixMatches = false
            break
          }
        }
        if (prefixMatches) {
          lookupMap.push(candidate)
        }
      }
    }

    const result = this._findCommand(context, lookupMap)
    if (!result) {
      return NoMatchingKb
    }

    // check we got all chords necessary to be sure a particular keybinding needs to be invoked
    if (pressedChords.length < result.chords.length) {
      // The chord sequence is not complete
      return MoreChordsNeeded
    }

    return KbFound(result.command, result.commandArgs, result.bubble)
  }

  private _findCommand(context: IContext, matches: ResolvedKeybindingItem[]): ResolvedKeybindingItem | null {
    for (let i = matches.length - 1; i >= 0; i--) {
      const k = matches[i]

      if (!KeybindingResolver._contextMatchesRules(context, k.when)) {
        continue
      }

      return k
    }

    return null
  }

  private static _contextMatchesRules(context: IContext, rules: ContextKeyExpression | null | undefined): boolean {
    if (!rules) {
      return true
    }

    return rules.evaluate(context)
  }

  public getDefaultKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._defaultKeybindings
  }

  public getKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._keybindings
  }

  // TODO: добавить получения списка дефолтных комманд, чтобы делать комментарий в keybindings.json
  // public getDefaultBoundCommands(): Map<string, boolean> {
  //   return this._defaultBoundCommands;
  // }
}
