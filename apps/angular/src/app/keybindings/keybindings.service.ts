import { inject, Injectable, OnDestroy } from '@angular/core';

import type { Keybinding } from './keybindings';
import type { IKeyboardMapper } from './keyboard-mapper';
import { IContextKeyService } from '~/context/context.service';
import type { IKeybindingItem } from './keybindings-registry';
import type { ResolvedKeybinding } from './resolved-keybinding';
import { ICommandService } from '~/commands/commands.service';

import { KeybindingResolver } from './keybindings-resolver';
import { IKeybindingsRegistry } from './keybindings-registry';
import { ResolvedKeybindingItem } from './resolved-keybinding-item';
import { AbstractKeybindingService } from './keybindings-abstract.service';
import { IKeyboardLayoutService } from './browser-keyboard-layout.service';
import { Logger } from '~/logger/logger';
import { isEditableElement } from '~/common/utils/dom/dom';

@Injectable({
  providedIn: 'root',
})
export class KeybindingService
  extends AbstractKeybindingService
  implements OnDestroy
{
  private _keyboardMapper: IKeyboardMapper;
  private _cachedResolver: KeybindingResolver | null;
  private _dynamicKeybindings: IKeybindingItem[];
  private readonly _keyboardLayoutService: IKeyboardLayoutService = inject(
    IKeyboardLayoutService,
  );
  private readonly _keybindingsRegistry: IKeybindingsRegistry =
    inject(IKeybindingsRegistry);

  constructor() {
    const logger = inject(Logger);
    super(inject(IContextKeyService), inject(ICommandService), logger);
    this._log('Constructor called, window:', {
      windowExists: typeof window !== 'undefined',
    });

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

      this._log('Key pressed', {
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

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handler);

      this._register({
        dispose: () => window.removeEventListener('keydown', handler),
      });
    }
  }

  protected _documentHasFocus(): boolean {
    return typeof document !== 'undefined' && document.hasFocus();
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

  public resolveKeybinding(_keybinding: Keybinding): IKeybindingItem[] {
    return [];
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
      } else {
        const resolvedKeybindings =
          this._keyboardMapper.resolveKeybinding(keybinding);
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

  public ngOnDestroy() {
    this.dispose();
  }
}
