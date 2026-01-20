import type { Keybinding } from './keybindings'
import type { IKeyboardMapper } from './keyboard-mapper'
import type { IContextKeyService } from '../context/context'
import type { IKeybindingItem } from './keybindings.registry'
import type { IKeyboardLayoutService } from './keyboard-layout'
import type { ResolvedKeybinding } from './resolved-keybinding'
import type { ICommandService } from '../commands/commands.service'

import { KeybindingResolver } from './keybindings.resolver'
import { keybindingsRegistry } from './keybindings.registry'
import { ResolvedKeybindingItem } from './resolved-keybinding-item'
import { AbstractKeybindingService } from './keybindings.abstract-service'

export class KeybindingService extends AbstractKeybindingService {
  private _keyboardMapper: IKeyboardMapper
  private _cachedResolver: KeybindingResolver | null // Caches resolved keybindings
  private _dynamicKeybindings: IKeybindingItem[] // User-defined keybindings
  // private readonly _domNodeListeners: DomNodeListeners[] // DOM event listeners

  constructor(
    protected override _contextKeyService: IContextKeyService,
    protected override _commandService: ICommandService,
    private readonly _keyboardLayoutService: IKeyboardLayoutService,
  ) {
    super(
      _contextKeyService,
      _commandService,
    )

    this._keyboardMapper = this._keyboardLayoutService.getKeyboardMapper()
    this._cachedResolver = null
    this._dynamicKeybindings = []
    this._registerDOMListeners()
  }

  private _registerDOMListeners(): void {
    // В Electron обычно достаточно слушать window
    // Используем arrow function, чтобы сохранить this
    const handler = (e: KeyboardEvent) => {
      this._dispatch(e, e.target)
    }

    window.addEventListener('keydown', handler)

    // Добавляем в disposables, чтобы при уничтожении сервиса отписаться
    this._register({
      dispose: () => window.removeEventListener('keydown', handler),
    })
  }

  protected _documentHasFocus(): boolean {
    return document.hasFocus()
  }

  protected _getResolver(): KeybindingResolver {
    if (!this._cachedResolver) {
      // 1. Берем дефолтные биндинги из Реестра
      const defaultItems = keybindingsRegistry.getDefaultKeybindings()

      // 2. Превращаем сырые IKeybindingItem в ResolvedKeybindingItem
      const defaults = this._resolveKeybindingItems(defaultItems, true)
      const overrides = this._resolveKeybindingItems(this._dynamicKeybindings, false)

      this._cachedResolver = new KeybindingResolver(defaults, overrides)
    }
    return this._cachedResolver
  }

  public resolveKeyboardEvent(keyboardEvent: KeyboardEvent): ResolvedKeybinding {
    return this._keyboardMapper.resolveKeyboardEvent(keyboardEvent)
  }

  // Превращает Keybinding (из конфига) в массив ResolvedKeybindingItem (для поиска)
  public resolveKeybinding(_keybinding: Keybinding): IKeybindingItem[] {
    // В VS Code тут сложная логика для разных раскладок.
    // В нашей упрощенной схеме мы возвращаем пустой массив или реализуем простой поиск,
    // если тебе нужно искать биндинги программно.
    // Для работы _dispatch это обычно не критично.
    return []
  }

  public addDynamicKeybinding(item: IKeybindingItem): void {
    this._dynamicKeybindings.push(item)
    this.updateResolver()
  }

  public updateResolver(): void {
    this._cachedResolver = null // Сброс кэша заставит пересоздать Resolver при следующем нажатии
  }

  private _resolveKeybindingItems(items: IKeybindingItem[], isDefault: boolean): ResolvedKeybindingItem[] {
    const result: ResolvedKeybindingItem[] = []
    let resultLen = 0
    for (const item of items) {
      const when = item.when || undefined
      const keybinding = item.keybinding
      if (!keybinding) {
        // This might be a removal keybinding item in user settings => accept it
        result[resultLen++] = new ResolvedKeybindingItem(undefined, item.command, item.commandArgs, when, isDefault)
      }
      else {
        const resolvedKeybindings = this._keyboardMapper.resolveKeybinding(keybinding)
        for (let i = resolvedKeybindings.length - 1; i >= 0; i--) {
          const resolvedKeybinding = resolvedKeybindings[i]
          result[resultLen++] = new ResolvedKeybindingItem(resolvedKeybinding, item.command, item.commandArgs, when, isDefault)
        }
      }
    }

    return result
  }
}
