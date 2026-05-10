import type { IDisposable } from "./lifecycle";

export interface Event<T> {
  (listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[]): IDisposable;
}

export class Emitter<T> {
  private _listeners?: { listener: (e: T) => void; thisArgs?: any }[];
  private _disposed = false;

  readonly event: Event<T> = (listener, thisArgs, disposables) => {
    if (this._disposed) {
      return { dispose() {} };
    }
    const item = { listener, thisArgs };
    this._listeners ??= [];
    this._listeners.push(item);
    const result: IDisposable = {
      dispose: () => {
        if (this._listeners) {
          const idx = this._listeners.indexOf(item);
          if (idx !== -1) {
            this._listeners.splice(idx, 1);
          }
        }
      },
    };
    if (disposables) {
      disposables.push(result);
    }
    return result;
  };

  fire(event: T): void {
    if (this._listeners) {
      for (const item of [...this._listeners]) {
        item.listener.call(item.thisArgs, event);
      }
    }
  }

  hasListeners(): boolean {
    return !!this._listeners && this._listeners.length > 0;
  }

  dispose(): void {
    this._listeners = undefined;
    this._disposed = true;
  }
}
