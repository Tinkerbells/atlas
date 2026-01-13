import type { Keybinding } from './keybindings'
import type { ICommandService } from './commands.service'
import type { IKeybindingItem } from './keybindings.registry'
import type { ResolvedKeybinding } from './resolved-keybinding'
import type { ResolvedKeybindingItem } from './resolved-keybinding-item'

import { KeyboardLayoutUtils } from './keyboard-layout'
import { KeybindingResolver } from './keybindings.resolver'
import { keybindingsRegistry } from './keybindings.registry'
import { SimpleResolvedKeybinding } from './simple-resolved-keybinding'
import { AbstractKeybindingService } from './keybindings.abstract-service'

export class StandaloneKeybindingService extends AbstractKeybindingService {
  private _cachedResolver: KeybindingResolver | null // Caches resolved keybindings
  private _dynamicKeybindings: IKeybindingItem[] // User-defined keybindings
  // private readonly _domNodeListeners: DomNodeListeners[] // DOM event listeners

  constructor(
    protected override _commandService: ICommandService,
  ) {
    super(_commandService)

    this._cachedResolver = null
    this._dynamicKeybindings = []
    this._registerDOMListeners()
  }

  private _registerDOMListeners(): void {
    // В Electron ФМ обычно достаточно слушать window
    // Используем arrow function, чтобы сохранить this
    const handler = (e: KeyboardEvent) => {
      // Игнорируем, если фокус в input/textarea (если нужно)
      // В VS Code это решается через контекст 'inputFocus', но можно и грубо:
      /*
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          // Исключение для команд типа Ctrl+C/V/Z/A
          // ... логика исключений
      }
      */

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
      const defaults = this._toNormalizedKeybindingItems(defaultItems, true)
      const overrides = this._toNormalizedKeybindingItems(this._dynamicKeybindings, false)

      this._cachedResolver = new KeybindingResolver(defaults, overrides)
    }
    return this._cachedResolver
  }

  public resolveKeyboardEvent(keyboardEvent: KeyboardEvent): ResolvedKeybinding {
    return KeyboardLayoutUtils.resolveKeyboardEvent(keyboardEvent)
  }

  // Превращает Keybinding (из конфига) в массив ResolvedKeybindingItem (для поиска)
  public resolveKeybinding(_keybinding: Keybinding): IKeybindingItem[] {
    // В VS Code тут сложная логика для разных раскладок.
    // В нашей упрощенной схеме мы возвращаем пустой массив или реализуем простой поиск,
    // если тебе нужно искать биндинги программно.
    // Для работы _dispatch это обычно не критично.
    return []
  }

  // --- Динамические биндинги (User Settings) ---

  public addDynamicKeybinding(item: IKeybindingItem): void {
    this._dynamicKeybindings.push(item)
    this.updateResolver()
  }

  public updateResolver(): void {
    this._cachedResolver = null // Сброс кэша заставит пересоздать Resolver при следующем нажатии
  }

  private _toNormalizedKeybindingItems(items: IKeybindingItem[], isDefault: boolean): ResolvedKeybindingItem[] {
    const result: ResolvedKeybindingItem[] = []

    for (const item of items) {
      const keybinding = item.keybinding

      if (!keybinding || keybinding.chords.length === 0) {
        continue
      }

      const resolvedKeybinding = new SimpleResolvedKeybinding(keybinding.chords)

      // Создаем финальный айтем для ресолвера
      // Важно: ResolvedKeybindingItem импортируем из твоего файла
      result.push({
        resolvedKeybinding,
        chords: keybinding.chords, // Дублируем для быстрого доступа
        command: item.command,
        commandArgs: item.commandArgs,
        when: item.when,
        isDefault,
        // Методы, которые требует класс ResolvedKeybindingItem (если ты используешь класс, а не интерфейс)
        // ... new ResolvedKeybindingItem(...)
      } as any) // Каст, если типы чуть не сходятся в черновике
    }

    return result
  }
}
