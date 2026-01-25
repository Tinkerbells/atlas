import type { Keybinding } from './keybindings'
import type { IKeybindingItem } from './keybindings.registry'
import type { ResolvedKeybinding } from './resolved-keybinding'
import type { KeybindingResolver } from './keybindings.resolver'
import type { ICommandService } from '../commands/commands.service'
import type { ResolvedKeybindingItem } from './resolved-keybinding-item'
import type { IContextKeyService, IContextKeyServiceTarget } from '../context/context.service'

import { IntervalTimer } from '../shared/utils/async/async'
import { Disposable } from '../shared/core/disposable'
import { ResultKind } from './keybindings.resolver'

interface CurrentChord {
  keypress: string
  label: string | null
}

export abstract class AbstractKeybindingService extends Disposable {
  private _currentChords: CurrentChord[]

  protected _currentlyDispatchingCommandId: string | null

  private _currentChordChecker: IntervalTimer

  public get inChordMode(): boolean {
    return this._currentChords.length > 0
  }

  constructor(
    protected _contextKeyService: IContextKeyService,
    protected _commandService: ICommandService,
  ) {
    super()

    this._currentChords = []
    this._currentlyDispatchingCommandId = null
    this._currentChordChecker = new IntervalTimer()
  }

  public override dispose(): void {
    this._leaveChordMode()
    super.dispose()
  }

  protected abstract _getResolver(): KeybindingResolver
  protected abstract _documentHasFocus(): boolean

  public abstract resolveKeybinding(keybinding: Keybinding): IKeybindingItem[]
  public abstract resolveKeyboardEvent(keyboardEvent: KeyboardEvent): ResolvedKeybinding

  public getDefaultKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._getResolver().getDefaultKeybindings()
  }

  public getKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._getResolver().getKeybindings()
  }

  private _scheduleLeaveChordMode(): void {
    const chordLastInteractedTime = Date.now()
    this._currentChordChecker.cancelAndSet(() => {
      if (!this._documentHasFocus()) {
        this._leaveChordMode()
        return
      }

      if (Date.now() - chordLastInteractedTime > 5000) {
        this._leaveChordMode()
      }
    }, 500)
  }

  public dispatchEvent(e: KeyboardEvent, target: any): boolean {
    return this._dispatch(e, target)
  }

  protected _dispatch(e: KeyboardEvent, target: any): boolean {
    return this._doDispatch(this.resolveKeyboardEvent(e), target)
  }

  private _doDispatch(userKeypress: ResolvedKeybinding, target: IContextKeyServiceTarget): boolean {
    let shouldPreventDefault = false

    let userPressedChord: string | null = null

    let currentChords: string[] | null = null

    const [dispatchKeyname] = userKeypress.getDispatchChords()
    userPressedChord = dispatchKeyname

    currentChords = this._currentChords.map(({ keypress }) => keypress)

    if (userPressedChord === null) {
      return shouldPreventDefault
    }
    const contextValue = this._contextKeyService.getContext(target)
    const readableChords = [...currentChords, userPressedChord].join(' → ')
    console.log(`[keybinding] pressed: ${readableChords || '(none)'}`)
    const resolveResult = this._getResolver().resolve(contextValue, currentChords, userPressedChord)

    switch (resolveResult.kind) {
      case ResultKind.NoMatchingKb: {
        if (this.inChordMode) {
          this._leaveChordMode()

          shouldPreventDefault = true
        }
        return shouldPreventDefault
      }

      case ResultKind.MoreChordsNeeded: {
        shouldPreventDefault = true
        this._currentChords.push({ keypress: userPressedChord, label: null })
        this._scheduleLeaveChordMode()
        return shouldPreventDefault
      }

      case ResultKind.KbFound: {
        if (resolveResult.commandId === null || resolveResult.commandId === '') {
          if (this.inChordMode) {
            this._leaveChordMode()
            shouldPreventDefault = true
          }
        }
        else {
          if (this.inChordMode) {
            this._leaveChordMode()
          }

          if (!resolveResult.isBubble) {
            shouldPreventDefault = true
          }

          this._currentlyDispatchingCommandId = resolveResult.commandId
          try {
            if (typeof resolveResult.commandArgs === 'undefined') {
              this._commandService.executeCommand(resolveResult.commandId).catch(() => { })
            }
            else {
              this._commandService.executeCommand(resolveResult.commandId, resolveResult.commandArgs).catch(() => { })
            }
          }
          finally {
            this._currentlyDispatchingCommandId = null
          }
        }

        return shouldPreventDefault
      }
    }
  }

  private _leaveChordMode(): void {
    this._currentChords = []
    this._currentChordChecker.cancel()
  }
}
