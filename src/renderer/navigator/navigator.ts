import type { Event } from "@core/base/event";
import type { URI } from "@platform/common/uri/uri";
import type { IDisposable } from "@core/base/lifecycle";

import { createDecorator } from "@core/di/instantiation";

export const INavigatorService = createDecorator<INavigatorService>("navigatorService");

export const enum PaneType {
  Explorer = 1,
  Commander,
  Preview,
  Terminal,
}

export interface IPane {
  readonly id: string;
  readonly type: PaneType;
  readonly title: string;
  readonly resource: URI | undefined;
  readonly isActive: boolean;
}

export interface IPaneGroup {
  readonly id: string;
  readonly panes: readonly IPane[];
  readonly activePane: IPane | undefined;
  readonly isActive: boolean;
}

export interface INavigatorLayout {
  readonly paneGroups: readonly IPaneGroup[];
  readonly activePaneGroup: IPaneGroup | undefined;
}

export interface INavigatorService extends IDisposable {
  readonly _serviceBrand: undefined;

  readonly onDidChangeLayout: Event<INavigatorLayout>;
  readonly onDidActivePaneChange: Event<IPane | undefined>;
  readonly onDidActivePaneResourceChange: Event<{ paneId: string; resource: URI }>;

  readonly layout: INavigatorLayout;

  openPane: (resource: URI, options?: { group?: string; type?: PaneType; title?: string }) => void;
  navigateActivePane: (resource: URI) => void;
  closePane: (paneId: string) => void;
  activatePane: (paneId: string) => void;
  movePane: (paneId: string, targetGroupId: string) => void;
}
