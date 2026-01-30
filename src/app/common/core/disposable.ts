/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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

class FunctionDisposable implements IDisposable {
  private _isDisposed: boolean
  private readonly _fn: () => void

  constructor(fn: () => void) {
    this._isDisposed = false
    this._fn = fn
    // trackDisposable(this)
  }

  dispose() {
    if (this._isDisposed) {
      return
    }
    if (!this._fn) {
      throw new Error(`Unbound disposable context: Need to use an arrow function to preserve the value of this`)
    }
    this._isDisposed = true
    // markAsDisposed(this)
    this._fn()
  }
}

/**
 * Turn a function that implements dispose into an {@link IDisposable}.
 *
 * @param fn Clean up function, guaranteed to be called only **once**.
 */
export function toDisposable(fn: () => void): IDisposable {
  return new FunctionDisposable(fn)
}
