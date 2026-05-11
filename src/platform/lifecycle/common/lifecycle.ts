/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { BrowserWindow } from "electron";
import type { Event } from "@core/base/event";
import type { IDisposable } from "@core/base/lifecycle";

import { createDecorator } from "@core/di/instantiation";

export const enum LifecycleMainPhase {
  Starting = 1,
  Ready = 2,
  AfterWindowOpen = 3,
  Eventually = 4,
}

export const enum ShutdownReason {
  QUIT = 1,
  RELOAD = 2,
  LOAD = 3,
  CLOSE = 4,
}

export interface IWindowUnloadEvent {
  readonly windowId: number;
  readonly reason: ShutdownReason;
  veto: (value: boolean | Promise<boolean>) => void;
}

export const ILifecycleMainService = createDecorator<ILifecycleMainService>("lifecycle-main-service");

export interface ILifecycleMainService {
  readonly _serviceBrand: undefined;

  /**
   * The current lifecycle phase.
   */
  readonly phase: LifecycleMainPhase;

  /**
   * Fired before the application shuts down. Allows veto.
   */
  readonly onBeforeShutdown: Event<void>;

  /**
   * Fired when the application will shut down. No veto possible.
   */
  readonly onWillShutdown: Event<void>;

  /**
   * Fired before a window closes. Allows veto from renderer.
   */
  readonly onBeforeCloseWindow: Event<IWindowUnloadEvent>;

  /**
   * Register a window to participate in lifecycle events.
   */
  registerWindow: (window: BrowserWindow) => IDisposable;

  /**
   * Set the lifecycle phase.
   */
  setPhase: (phase: LifecycleMainPhase) => void;

  /**
   * Returns a promise that resolves when the given phase is reached.
   */
  when: (phase: LifecycleMainPhase) => Promise<void>;

  /**
   * Quit the application gracefully.
   */
  quit: (exitCode?: number) => Promise<void>;

  /**
   * Kill the application immediately.
   */
  kill: (exitCode?: number) => void;

  /**
   * Reload a window.
   */
  reload: (window: BrowserWindow) => void;
}
