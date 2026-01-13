export interface IDisposable {
  dispose: () => void
}

export class DisposableStore implements IDisposable {
  // Используем Set, чтобы хранить уникальные ссылки на очистку
  private _toDispose = new Set<IDisposable>()
  private _isDisposed = false

  /**
   * Главный метод: "Кинуть в ведро"
   * Мы принимаем объект, сохраняем его и возвращаем его же (для удобства)
   */
  public add<T extends IDisposable>(t: T): T {
    if (!t)
      return t

    // Если ведро уже "на помойке" (сам Store удален),
    // то сразу очищаем входящий объект, чтобы не было утечки.
    if (this._isDisposed) {
      console.warn('Попытка добавить мусор в уже выброшенное ведро!')
      t.dispose()
    }
    else {
      this._toDispose.add(t)
    }

    return t
  }

  // "Вынести мусор"
  public dispose(): void {
    if (this._isDisposed)
      return // Уже вынесли

    this._isDisposed = true

    // Проходим по всему, что накопили, и вызываем dispose()
    this._toDispose.forEach((item) => {
      try {
        item.dispose()
      }
      catch (e) {
        console.error('Ошибка при очистке:', e)
      }
    })

    // Очищаем сам список
    this._toDispose.clear()
  }
}

export abstract class Disposable implements IDisposable {
  // У каждого наследника будет своё личное "ведро"
  private readonly _store = new DisposableStore()

  constructor() {
    // В VS Code тут еще трекинг для отладки, нам пока не надо
  }

  public dispose(): void {
    // Просто выкидываем всё содержимое ведра
    this._store.dispose()
  }

  // "Магический" метод.
  // Ты оборачиваешь в него создание ресурса, и он сразу летит в ведро.
  protected _register<T extends IDisposable>(t: T): T {
    return this._store.add(t)
  }
}
