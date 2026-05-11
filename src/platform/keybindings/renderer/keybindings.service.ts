/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { isEditableElement } from "@core/base";
import { ILogger } from "@platform/logger/common/logger";
import { IContextKeyService } from "@platform/context/renderer/context-key";
import { ICommandService } from "@platform/commands/renderer/commands-service";
import { createDecorator, InstantiationType, registerSingleton } from "@core/di";

import type { Keybinding } from "./keybindings";
import type { IKeyboardMapper } from "./keyboard-mapper";
import type { IKeybindingItem } from "./keybindings-registry";
import type { ResolvedKeybinding } from "./resolved-keybinding";

import { IKeypressEventBus } from "./keypress-event-bus";
import { KeybindingResolver } from "./keybindings-resolver";
import { IKeybindingsRegistry } from "./keybindings-registry";
import { ResolvedKeybindingItem } from "./resolved-keybinding-item";
import { AbstractKeybindingService } from "./keybindings-abstract.service";
import { IKeyboardLayoutService } from "./browser-keyboard-layout.service";

export interface IKeybindingService extends AbstractKeybindingService {
  readonly _serviceBrand: undefined;

  addDynamicKeybinding: (item: IKeybindingItem) => void;
  updateResolver: () => void;
}

export const IKeybindingService = createDecorator<IKeybindingService>("keybindingService");

export class KeybindingService extends AbstractKeybindingService {
  declare readonly _serviceBrand: undefined;

  private _keyboardMapper: IKeyboardMapper;
  private _cachedResolver: KeybindingResolver | null;
  private _dynamicKeybindings: IKeybindingItem[];
  private readonly _keyboardLayoutService: IKeyboardLayoutService;
  private readonly _keybindingsRegistry: IKeybindingsRegistry;

  constructor(
    @IContextKeyService _contextKeyService: IContextKeyService,
    @ICommandService _commandService: ICommandService,
    @ILogger _logger: ILogger,
    @IKeyboardLayoutService _keyboardLayoutService: IKeyboardLayoutService,
    @IKeybindingsRegistry _keybindingsRegistry: IKeybindingsRegistry,
    @IKeypressEventBus _keypressBus: IKeypressEventBus,
  ) {
    super(_contextKeyService, _commandService, _logger, _keypressBus);

    this._keyboardLayoutService = _keyboardLayoutService;
    this._keybindingsRegistry = _keybindingsRegistry;
    this._keyboardMapper = this._keyboardLayoutService.getKeyboardMapper();
    this._cachedResolver = null;
    this._dynamicKeybindings = [];
    this._registerDOMListeners();
  }

  private _registerDOMListeners(): void {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && isEditableElement(e.target)) {
        return;
      }

      this._log("Key pressed", {
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        target: e.target,
      });
      if (e.target instanceof HTMLElement) {
        const shouldPrevent = this._dispatch(e, e.target);
        if (shouldPrevent) {
          e.preventDefault();
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handler);

      this._register({
        dispose: () => window.removeEventListener("keydown", handler),
      });
    }
  }

  protected _documentHasFocus(): boolean {
    return typeof document !== "undefined" && document.hasFocus();
  }

  protected _getResolver(): KeybindingResolver {
    if (!this._cachedResolver) {
      const defaultItems = this._keybindingsRegistry.getDefaultKeybindings();

      const defaults = this._resolveKeybindingItems(defaultItems, true);
      const overrides = this._resolveKeybindingItems(
        this._dynamicKeybindings,
        false,
      );

      this._cachedResolver = new KeybindingResolver(defaults, overrides);
    }
    return this._cachedResolver;
  }

  public resolveKeyboardEvent(
    keyboardEvent: KeyboardEvent,
  ): ResolvedKeybinding {
    return this._keyboardMapper.resolveKeyboardEvent(keyboardEvent);
  }

  public resolveKeybinding(keybinding: Keybinding): IKeybindingItem[] {
    const resolvedKeybindings = this._keyboardMapper.resolveKeybinding(keybinding);
    const result: IKeybindingItem[] = [];

    for (const resolved of resolvedKeybindings) {
      const chords = resolved.getDispatchChords();
      if (chords.length > 0 && chords[0]) {
        const lookupItems = this._getResolver().lookupKeybindings(chords[0]);
        for (const lookupItem of lookupItems) {
          result.push({
            keybinding,
            command: lookupItem.command,
            commandArgs: lookupItem.commandArgs,
            when: lookupItem.when,
            weight1: 0,
            weight2: 0,
          });
        }
      }
    }

    return result;
  }

  public addDynamicKeybinding(item: IKeybindingItem): void {
    this._dynamicKeybindings.push(item);
    this.updateResolver();
  }

  public updateResolver(): void {
    this._cachedResolver = null;
  }

  private _resolveKeybindingItems(
    items: IKeybindingItem[],
    isDefault: boolean,
  ): ResolvedKeybindingItem[] {
    const result: ResolvedKeybindingItem[] = [];
    let resultLen = 0;
    for (const item of items) {
      const when = item.when || undefined;
      const keybinding = item.keybinding;
      if (!keybinding) {
        result[resultLen++] = new ResolvedKeybindingItem(
          undefined,
          item.command,
          item.commandArgs,
          when,
          isDefault,
        );
      }
      else {
        const resolvedKeybindings
          = this._keyboardMapper.resolveKeybinding(keybinding);
        for (let i = resolvedKeybindings.length - 1; i >= 0; i--) {
          const resolvedKeybinding = resolvedKeybindings[i];
          result[resultLen++] = new ResolvedKeybindingItem(
            resolvedKeybinding,
            item.command,
            item.commandArgs,
            when,
            isDefault,
          );
        }
      }
    }

    return result;
  }
}

registerSingleton(IKeybindingService, KeybindingService, InstantiationType.Delayed);
