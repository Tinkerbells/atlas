export interface Event<T> {
  (listener: (e: T) => any, thisArgs?: any): IDisposable;
}

export interface IDisposable {
  dispose: () => void;
}

interface EmitterOptions {
  onFirstListenerAdd?: Function;
  onFirstListenerDidAdd?: Function;
  onListenerDidAdd?: Function;
  onLastListenerRemove?: Function;
  leakWarningThreshold?: number;
  errorHandling?: "warn" | "error" | "propagate";
}

export class Emitter<T> implements IDisposable {
  private static _noop = function () {};

  private _event?: Event<T>;
  private _disposed = false;
  private _listeners?: Function[];
  private _options?: EmitterOptions;

  constructor(options?: EmitterOptions) {
    this._options = options;
  }

  get event(): Event<T> {
    if (!this._event) {
      this._event = (listener: (e: T) => any, thisArgs?: any) => {
        if (!this._listeners) {
          this._listeners = [];
          this._options?.onFirstListenerAdd?.(this);
        }
        if (this._options?.onFirstListenerAdd) {
          this._options.onFirstListenerAdd(this);
        }
        this._listeners.push(thisArgs ? listener.bind(thisArgs) : listener);
        if (this._options?.onFirstListenerDidAdd) {
          this._options.onFirstListenerDidAdd(this, listener, thisArgs);
        }
        this._options?.onListenerDidAdd?.(this, listener, thisArgs);
        if (this._options?.onLastListenerRemove) {
          const removeListener = () => {
            if (this._listeners) {
              const index = this._listeners.indexOf(listener);
              if (index > -1) {
                this._listeners.splice(index, 1);
                if (this._listeners.length === 0) {
                  this._options?.onLastListenerRemove?.(this);
                  this._listeners = undefined;
                }
              }
            }
          };
          return { dispose: removeListener };
        }
        const self = this;
        const result = {
          dispose: () => {
            result.dispose = Emitter._noop;
            if (!self._disposed) {
              removeListener();
            }
          },
        };
        function removeListener() {
          if (self._listeners) {
            const index = self._listeners.indexOf(listener);
            if (index > -1) {
              self._listeners.splice(index, 1);
              if (self._listeners.length === 0) {
                self._options?.onLastListenerRemove?.(self);
                self._listeners = undefined;
              }
            }
          }
        }
        return result;
      };
    }
    return this._event;
  }

  fire(event: T): void {
    if (this._listeners) {
      for (const listener of this._listeners.slice(0)) {
        try {
          listener(event);
        }
        catch (e) {
          if (this._options?.errorHandling === "propagate") {
            throw e;
          }
          else {
            console.error(e);
          }
        }
      }
    }
  }

  dispose(): void {
    if (this._listeners) {
      this._listeners = undefined;
    }
    this._disposed = true;
    this._options?.onLastListenerRemove?.(this);
  }
}

export class EventEmitter<T = void> extends Emitter<T> {}
