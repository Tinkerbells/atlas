import type { IDisposable } from "@atlas/shared";

import { Disposable } from "@atlas/shared";
import { createDecorator, InstantiationType, registerSingleton } from "@atlas/di";

export interface KeypressEvent {
  readonly timestamp: number;
  readonly key: string;
  readonly code: string;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly resolvedLabel: string | null;
  readonly commandId: string | null;
  readonly resultKind: "none" | "moreChords" | "found";
}

export interface IKeypressEventBus {
  readonly _serviceBrand: undefined;
  onKeypress: (listener: (e: KeypressEvent) => void) => IDisposable;
  emit: (event: KeypressEvent) => void;
}

export const IKeypressEventBus = createDecorator<IKeypressEventBus>("keypressEventBus");

export class KeypressEventBus extends Disposable implements IKeypressEventBus {
  public _serviceBrand: undefined;

  private _listeners: ((e: KeypressEvent) => void)[] = [];

  onKeypress(listener: (e: KeypressEvent) => void): IDisposable {
    this._listeners.push(listener);
    return {
      dispose: () => {
        const idx = this._listeners.indexOf(listener);
        if (idx !== -1) {
          this._listeners.splice(idx, 1);
        }
      },
    };
  }

  emit(event: KeypressEvent): void {
    for (const listener of this._listeners) {
      listener(event);
    }
  }

  override dispose(): void {
    this._listeners = [];
    super.dispose();
  }
}

registerSingleton(IKeypressEventBus, KeypressEventBus, InstantiationType.Eager);
