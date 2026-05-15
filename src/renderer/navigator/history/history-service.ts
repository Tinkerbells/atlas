import type { Event } from "@core/base/event";
import type { URI } from "@platform/common/uri/uri";

import { Emitter } from "@core/base/event";
import { Disposable } from "@core/base/lifecycle";

import type { INavigatorHistoryEntry, INavigatorHistoryService } from "./history";

const MAX_HISTORY_ENTRIES = 50;

export class NavigatorHistoryService extends Disposable implements INavigatorHistoryService {
  declare readonly _serviceBrand: undefined;

  private _backStack: INavigatorHistoryEntry[] = [];
  private _forwardStack: INavigatorHistoryEntry[] = [];
  private _navigating = false;

  private readonly _onDidChange = this._register(new Emitter<void>());
  readonly onDidChange: Event<void> = this._onDidChange.event;

  get canGoBack(): boolean {
    return this._backStack.length > 1;
  }

  get canGoForward(): boolean {
    return this._forwardStack.length > 0;
  }

  addEntry(resource: URI, paneId: string, groupId: string): void {
    if (this._navigating)
      return;

    const lastEntry = this._backStack[this._backStack.length - 1];
    if (lastEntry && lastEntry.paneId === paneId && lastEntry.resource.toString() === resource.toString()) {
      return;
    }

    this._backStack.push({ resource, paneId, groupId });
    this._forwardStack = [];

    if (this._backStack.length > MAX_HISTORY_ENTRIES) {
      this._backStack.shift();
    }

    this._onDidChange.fire();
  }

  goBack(): INavigatorHistoryEntry | undefined {
    if (!this.canGoBack)
      return undefined;

    const current = this._backStack.pop();
    if (current) {
      this._forwardStack.push(current);
    }

    const target = this._backStack[this._backStack.length - 1];
    if (!target)
      return undefined;

    this._onDidChange.fire();
    return target;
  }

  goForward(): INavigatorHistoryEntry | undefined {
    const target = this._forwardStack.pop();
    if (!target)
      return undefined;

    this._backStack.push(target);
    this._onDidChange.fire();
    return target;
  }

  removePane(paneId: string): void {
    const beforeBack = this._backStack.length;
    const beforeForward = this._forwardStack.length;

    this._backStack = this._backStack.filter(e => e.paneId !== paneId);
    this._forwardStack = this._forwardStack.filter(e => e.paneId !== paneId);

    if (this._backStack.length !== beforeBack || this._forwardStack.length !== beforeForward) {
      this._onDidChange.fire();
    }
  }

  clear(): void {
    this._backStack = [];
    this._forwardStack = [];
    this._onDidChange.fire();
  }
}
