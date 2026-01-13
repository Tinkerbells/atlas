export class ResolvedChord {
  constructor(
    public readonly ctrlKey: boolean,
    public readonly shiftKey: boolean,
    public readonly altKey: boolean,
    public readonly metaKey: boolean,
    public readonly keyLabel: string | null,
    public readonly keyAriaLabel: string | null,
  ) { }
}

export abstract class ResolvedKeybinding {
  /**
   * Лейбл для UI (например "Ctrl+S").
   */
  public abstract getLabel(): string | null

  /**
   * Лейбл для скринридеров (ARIA).
   */
  public abstract getAriaLabel(): string | null

  /**
   * Лейбл для нативного меню Electron (Accelerator).
   */
  public abstract getElectronAccelerator(): string | null

  /**
   * Лейбл для файла настроек пользователя (JSON).
   */
  public abstract getUserSettingsLabel(): string | null

  /**
   * Состоит ли биндинг из нескольких шагов (например, "Ctrl+K Ctrl+S")?
   */
  public abstract hasMultipleChords(): boolean

  /**
   * Возвращает массив детализированных объектов аккордов.
   */
  public abstract getChords(): ResolvedChord[]

  /**
   * [КРИТИЧЕСКИ ВАЖНО]
   * Возвращает массив строк для диспетчера: ["ctrl+s", null]
   * Возвращает null, если это не полноценный аккорд, а только модификатор.
   */
  public abstract getDispatchChords(): (string | null)[]
}
