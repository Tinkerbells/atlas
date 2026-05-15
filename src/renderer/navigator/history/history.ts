import type { Event } from "@core/base/event";
import type { URI } from "@platform/common/uri/uri";
import type { IDisposable } from "@core/base/lifecycle";

import { createDecorator } from "@core/di/instantiation";

export const INavigatorHistoryService = createDecorator<INavigatorHistoryService>("navigatorHistoryService");

export interface INavigatorHistoryEntry {
  readonly resource: URI;
  readonly paneId: string;
  readonly groupId: string;
}

export interface INavigatorHistoryService extends IDisposable {
  readonly _serviceBrand: undefined;

  readonly onDidChange: Event<void>;

  readonly canGoBack: boolean;
  readonly canGoForward: boolean;

  addEntry: (resource: URI, paneId: string, groupId: string) => void;
  goBack: () => INavigatorHistoryEntry | undefined;
  goForward: () => INavigatorHistoryEntry | undefined;
  removePane: (paneId: string) => void;
  clear: () => void;
}
