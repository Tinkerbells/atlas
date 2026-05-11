/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { Event } from "@core/base/event";
import type { IDisposable } from "@core/base/lifecycle";

import { Emitter } from "@core/base/event";
import { app, BrowserWindow } from "electron";
import { Disposable, DisposableStore, toDisposable } from "@core/base/lifecycle";

import type { ILifecycleMainService, IWindowUnloadEvent, LifecycleMainPhase } from "../common/lifecycle";

export class LifecycleMainService extends Disposable implements ILifecycleMainService {
  declare readonly _serviceBrand: undefined;

  private _phase: LifecycleMainPhase = 1; // Starting
  private readonly _phaseWhen = new Map<LifecycleMainPhase, Promise<void>>();
  private readonly _phaseResolvers = new Map<LifecycleMainPhase, () => void>();

  private readonly _onBeforeShutdown = this._register(new Emitter<void>());
  readonly onBeforeShutdown: Event<void> = this._onBeforeShutdown.event;

  private readonly _onWillShutdown = this._register(new Emitter<void>());
  readonly onWillShutdown: Event<void> = this._onWillShutdown.event;

  private readonly _onBeforeCloseWindow = this._register(new Emitter<IWindowUnloadEvent>());
  readonly onBeforeCloseWindow: Event<IWindowUnloadEvent> = this._onBeforeCloseWindow.event;

  private _quitRequested = false;
  private _quitCalled = false;

  constructor() {
    super();

    for (const phase of [2, 3, 4] as LifecycleMainPhase[]) {
      this._phaseWhen.set(phase, new Promise(resolve => this._phaseResolvers.set(phase, resolve)));
    }

    this.registerListeners();
  }

  private registerListeners(): void {
    // macOS: prevent quit when closing last window unless explicitly requested
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        this.quit();
      }
    });

    app.on("before-quit", async (e) => {
      if (this._quitCalled) {
        return;
      }

      this._quitCalled = true;
      this._quitRequested = true;

      e.preventDefault();

      // Fire before-shutdown to allow veto
      this._onBeforeShutdown.fire();

      // Wait for all windows to close gracefully
      await this._destroyAllWindows();

      this._onWillShutdown.fire();

      app.exit(0);
    });

    app.on("will-quit", (e) => {
      if (!this._quitCalled) {
        e.preventDefault();
        this.quit();
      }
    });
  }

  get phase(): LifecycleMainPhase {
    return this._phase;
  }

  setPhase(phase: LifecycleMainPhase): void {
    if (phase <= this._phase) {
      return;
    }

    this._phase = phase;
    this._phaseResolvers.get(phase)?.();
  }

  when(phase: LifecycleMainPhase): Promise<void> {
    if (phase <= this._phase) {
      return Promise.resolve();
    }
    return this._phaseWhen.get(phase) ?? Promise.resolve();
  }

  registerWindow(window: BrowserWindow): IDisposable {
    const disposables = new DisposableStore();

    const handler = (_event: Electron.Event, input: Electron.Input) => {
      if (input.key === "F5" || (input.key === "r" && (input.control || input.meta))) {
        window.webContents.reload();
      }
    };
    window.webContents.on("before-input-event", handler);
    disposables.add(toDisposable(() => window.webContents.removeListener("before-input-event", handler)));

    window.on("close", (e) => {
      // If quit was requested, allow the window to close
      if (this._quitRequested) {
        return;
      }

      // macOS: keep app alive when closing window
      if (process.platform === "darwin" && !this._quitRequested) {
        e.preventDefault();
        window.hide();
        return;
      }

      // Fire event to allow veto from renderer
      const unloadEvent: IWindowUnloadEvent = {
        windowId: window.id,
        reason: 4, // Close
        veto(value) {
          if (value === true || (value instanceof Promise)) {
            e.preventDefault();
          }
        },
      };

      this._onBeforeCloseWindow.fire(unloadEvent);
    });

    return disposables;
  }

  async quit(exitCode = 0): Promise<void> {
    if (this._quitCalled) {
      return;
    }

    this._quitCalled = true;
    this._quitRequested = true;

    this._onBeforeShutdown.fire();

    await this._destroyAllWindows();

    this._onWillShutdown.fire();

    app.exit(exitCode);
  }

  kill(exitCode = 0): void {
    this._quitCalled = true;
    this._quitRequested = true;
    this._onWillShutdown.fire();
    app.exit(exitCode);
  }

  reload(window: BrowserWindow): void {
    window.webContents.reload();
  }

  private async _destroyAllWindows(): Promise<void> {
    const windows = BrowserWindow.getAllWindows();
    await Promise.all(
      windows.map(async (window) => {
        return new Promise<void>((resolve) => {
          if (window.isDestroyed()) {
            resolve();
            return;
          }
          window.once("closed", () => resolve());
          window.close();
        });
      }),
    );
  }
}
