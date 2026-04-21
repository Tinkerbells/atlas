/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { Disposable, IntervalTimer } from "@atlas/shared";

import type { Keybinding } from "./keybindings";
import type { ILogger } from "../logger/logger";
import type { IKeybindingItem } from "./keybindings-registry";
import type { ResolvedKeybinding } from "./resolved-keybinding";
import type { KeybindingResolver } from "./keybindings-resolver";
import type { ICommandService } from "../commands/commands-service";
import type { ResolvedKeybindingItem } from "./resolved-keybinding-item";
import type { IKeypressEventBus, KeypressEvent } from "./keypress-event-bus";
import type { IContextKeyService, IContextKeyServiceTarget } from "../context/context-key";

import { ResultKind } from "./keybindings-resolver";

interface CurrentChord {
  keypress: string;
  label: string | null;
}

export abstract class AbstractKeybindingService extends Disposable {
  private _currentChords: CurrentChord[];
  private _currentChordModeTimestamp: number = 0;

  protected _currentlyDispatchingCommandId: string | null;

  protected _logging: boolean;

  private _currentChordChecker: IntervalTimer;

  public get inChordMode(): boolean {
    return this._currentChords.length > 0;
  }

  constructor(
    protected _contextKeyService: IContextKeyService,
    protected _commandService: ICommandService,
    protected _logger: ILogger,
    protected _keypressBus: IKeypressEventBus,
  ) {
    super();
    this._logging = true;
    this._currentChords = [];
    this._currentlyDispatchingCommandId = null;
    this._currentChordChecker = new IntervalTimer();
  }

  public toggleLogging(): boolean {
    this._logging = !this._logging;
    return this._logging;
  }

  protected _log(str: string, payload?: Record<string, unknown>): void {
    if (this._logging) {
      this._logger.info(str, {
        scope: "KeybindingService",
        payload,
      });
    }
  }

  public override dispose(): void {
    this._leaveChordMode();
    super.dispose();
  }

  protected abstract _getResolver(): KeybindingResolver;
  protected abstract _documentHasFocus(): boolean;

  public abstract resolveKeybinding(keybinding: Keybinding): IKeybindingItem[];
  public abstract resolveKeyboardEvent(
    keyboardEvent: KeyboardEvent,
  ): ResolvedKeybinding;

  public getDefaultKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._getResolver().getDefaultKeybindings();
  }

  public getKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._getResolver().getKeybindings();
  }

  private _scheduleLeaveChordMode(): void {
    this._currentChordModeTimestamp = Date.now();
    this._currentChordChecker.cancelAndSet(() => {
      if (!this._documentHasFocus()) {
        this._leaveChordMode();
        return;
      }

      if (Date.now() - this._currentChordModeTimestamp > 5000) {
        this._leaveChordMode();
      }
    }, 500);
  }

  public dispatchEvent(
    e: KeyboardEvent,
    target: IContextKeyServiceTarget,
  ): boolean {
    return this._dispatch(e, target);
  }

  protected _dispatch(
    e: KeyboardEvent,
    target: IContextKeyServiceTarget,
  ): boolean {
    if (!this._documentHasFocus()) {
      return false;
    }

    const resolved = this.resolveKeyboardEvent(e);
    this._log("Resolved keybinding", {
      resolved: JSON.stringify(resolved),
      event: e,
    });
    return this._doDispatch(e, resolved, target);
  }

  private _doDispatch(
    e: KeyboardEvent,
    userKeypress: ResolvedKeybinding,
    target: IContextKeyServiceTarget,
  ): boolean {
    let shouldPreventDefault = false;

    let userPressedChord: string | null = null;

    let currentChords: string[] | null = null;

    const [dispatchKeyname] = userKeypress.getDispatchChords();
    userPressedChord = dispatchKeyname;

    currentChords = this._currentChords.map(({ keypress }) => keypress);

    if (userPressedChord === null) {
      return shouldPreventDefault;
    }
    const contextValue = this._contextKeyService.getContext(target);
    const readableChords = [...currentChords, userPressedChord].join(" → ");
    this._log(`pressed: ${readableChords || "(none)"}`);
    const resolveResult = this._getResolver().resolve(
      contextValue,
      currentChords,
      userPressedChord,
    );

    const resolvedLabel = userKeypress.getLabel();

    switch (resolveResult.kind) {
      case ResultKind.NoMatchingKb: {
        this._emitKeypress(e, resolvedLabel, null, "none");
        if (this.inChordMode) {
          this._leaveChordMode();

          shouldPreventDefault = true;
        }
        return shouldPreventDefault;
      }

      case ResultKind.MoreChordsNeeded: {
        this._emitKeypress(e, resolvedLabel, null, "moreChords");
        shouldPreventDefault = true;
        this._currentChords.push({ keypress: userPressedChord, label: null });
        this._scheduleLeaveChordMode();
        return shouldPreventDefault;
      }

      case ResultKind.KbFound: {
        this._emitKeypress(e, resolvedLabel, resolveResult.commandId, "found");
        if (
          resolveResult.commandId === null
          || resolveResult.commandId === ""
        ) {
          if (this.inChordMode) {
            this._leaveChordMode();
            shouldPreventDefault = true;
          }
        }
        else {
          if (this.inChordMode) {
            this._leaveChordMode();
          }

          if (!resolveResult.isBubble) {
            shouldPreventDefault = true;
          }

          this._currentlyDispatchingCommandId = resolveResult.commandId;
          try {
            if (typeof resolveResult.commandArgs === "undefined") {
              this._commandService
                .executeCommand(resolveResult.commandId)
                .catch(() => {});
            }
            else {
              this._commandService
                .executeCommand(
                  resolveResult.commandId,
                  resolveResult.commandArgs,
                )
                .catch(() => {});
            }
          }
          finally {
            this._currentlyDispatchingCommandId = null;
          }
        }

        return shouldPreventDefault;
      }
    }
  }

  private _emitKeypress(
    e: KeyboardEvent,
    resolvedLabel: string | null,
    commandId: string | null,
    resultKind: KeypressEvent["resultKind"],
  ): void {
    this._keypressBus.emit({
      timestamp: Date.now(),
      key: e.key,
      code: e.code,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      resolvedLabel,
      commandId,
      resultKind,
    });
  }

  private _leaveChordMode(): void {
    this._currentChords = [];
    this._currentChordModeTimestamp = 0;
    this._currentChordChecker.cancel();
  }
}
