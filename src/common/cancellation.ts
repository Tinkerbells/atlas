export interface CancellationToken {
  readonly isCancellationRequested: boolean;
  onCancellationRequested: (listener: (e: any) => any) => { dispose: () => void };
}

export const cancelled = (): Error => new Error("Cancelled");

export class CancellationTokenSource implements CancellationToken {
  private _isCancelled = false;
  private _listeners: ((e: any) => void)[] = [];

  get isCancellationRequested(): boolean {
    return this._isCancelled;
  }

  onCancellationRequested = (listener: (e: any) => any): { dispose: () => void } => {
    this._listeners.push(listener);
    return {
      dispose: () => {
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      },
    };
  };

  cancel(): void {
    if (!this._isCancelled) {
      this._isCancelled = true;
      for (const listener of this._listeners) {
        listener(undefined);
      }
    }
  }
}

export namespace CancellationToken {
  export const None: CancellationToken = {
    isCancellationRequested: false,
    onCancellationRequested: () => ({ dispose: () => {} }),
  };
}
