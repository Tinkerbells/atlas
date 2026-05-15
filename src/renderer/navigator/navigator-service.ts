import type { Event } from "@core/base/event";
import type { URI } from "@platform/common/uri/uri";

import { Emitter } from "@core/base/event";
import { Disposable } from "@core/base/lifecycle";

import type { INavigatorLayout, INavigatorService, IPane, IPaneGroup, PaneType } from "./navigator";

export class NavigatorService extends Disposable implements INavigatorService {
  declare readonly _serviceBrand: undefined;

  private _paneGroups: Map<string, IPaneGroup> = new Map();
  private _panes: Map<string, IPane> = new Map();
  private _activePaneId: string | undefined;
  private _activeGroupId: string | undefined;
  private _paneCounter = 0;
  private _groupCounter = 0;

  private readonly _onDidChangeLayout = this._register(new Emitter<INavigatorLayout>());
  readonly onDidChangeLayout: Event<INavigatorLayout> = this._onDidChangeLayout.event;

  private readonly _onDidActivePaneChange = this._register(new Emitter<IPane | undefined>());
  readonly onDidActivePaneChange: Event<IPane | undefined> = this._onDidActivePaneChange.event;

  private readonly _onDidActivePaneResourceChange = this._register(new Emitter<{ paneId: string; resource: URI }>());
  readonly onDidActivePaneResourceChange: Event<{ paneId: string; resource: URI }> = this._onDidActivePaneResourceChange.event;

  get layout(): INavigatorLayout {
    const paneGroups = [...this._paneGroups.values()];
    const activePaneGroup = this._activeGroupId
      ? this._paneGroups.get(this._activeGroupId)
      : paneGroups[0];
    return { paneGroups, activePaneGroup };
  }

  openPane(resource: URI, options?: { group?: string; type?: PaneType; title?: string }): void {
    const type = options?.type ?? 1; // Explorer by default
    const groupId = options?.group ?? this._getOrCreateDefaultGroup().id;
    const paneId = `pane-${++this._paneCounter}`;
    const pane: IPane = {
      id: paneId,
      type,
      title: options?.title ?? this._getBaseName(resource.path),
      resource,
      isActive: false,
    };

    this._panes.set(paneId, pane);

    const group = this._paneGroups.get(groupId);
    if (group) {
      const updatedPanes = [...group.panes, pane];
      const updatedGroup: IPaneGroup = {
        ...group,
        panes: updatedPanes,
        activePane: pane,
      };
      this._paneGroups.set(groupId, updatedGroup);
    }

    this._activatePane(paneId);
    this._fireLayoutChange();
  }

  navigateActivePane(resource: URI): void {
    if (!this._activePaneId)
      return;

    const pane = this._panes.get(this._activePaneId);
    if (!pane)
      return;

    const updatedPane: IPane = {
      ...pane,
      resource,
      title: this._getBaseName(resource.path),
    };

    this._panes.set(this._activePaneId, updatedPane);

    // Update in group
    for (const [groupId, group] of this._paneGroups) {
      const paneIndex = group.panes.findIndex(p => p.id === this._activePaneId);
      if (paneIndex !== -1) {
        const updatedPanes = [...group.panes];
        updatedPanes[paneIndex] = updatedPane;
        this._paneGroups.set(groupId, {
          ...group,
          panes: updatedPanes,
          activePane: updatedPane,
        });
        break;
      }
    }

    this._onDidActivePaneResourceChange.fire({ paneId: this._activePaneId, resource });
    this._fireLayoutChange();
  }

  closePane(paneId: string): void {
    const pane = this._panes.get(paneId);
    if (!pane)
      return;

    this._panes.delete(paneId);

    // Find and update the group containing this pane
    for (const [groupId, group] of this._paneGroups) {
      const paneIndex = group.panes.findIndex(p => p.id === paneId);
      if (paneIndex !== -1) {
        const updatedPanes = group.panes.filter(p => p.id !== paneId);
        const updatedGroup: IPaneGroup = {
          ...group,
          panes: updatedPanes,
          activePane: updatedPanes[updatedPanes.length - 1],
        };
        this._paneGroups.set(groupId, updatedGroup);

        if (updatedPanes.length === 0) {
          this._paneGroups.delete(groupId);
        }
        break;
      }
    }

    if (this._activePaneId === paneId) {
      this._activePaneId = undefined;
    }

    this._fireLayoutChange();
  }

  activatePane(paneId: string): void {
    this._activatePane(paneId);
    this._fireLayoutChange();
  }

  movePane(paneId: string, targetGroupId: string): void {
    const pane = this._panes.get(paneId);
    if (!pane)
      return;

    // Remove from current group
    for (const [groupId, group] of this._paneGroups) {
      if (group.panes.some(p => p.id === paneId)) {
        const updatedPanes = group.panes.filter(p => p.id !== paneId);
        const updatedGroup: IPaneGroup = {
          ...group,
          panes: updatedPanes,
          activePane: updatedPanes[updatedPanes.length - 1],
        };
        if (updatedPanes.length === 0) {
          this._paneGroups.delete(groupId);
        }
        else {
          this._paneGroups.set(groupId, updatedGroup);
        }
        break;
      }
    }

    // Add to target group
    const targetGroup = this._paneGroups.get(targetGroupId);
    if (targetGroup) {
      const updatedPanes = [...targetGroup.panes, pane];
      const updatedGroup: IPaneGroup = {
        ...targetGroup,
        panes: updatedPanes,
        activePane: pane,
      };
      this._paneGroups.set(targetGroupId, updatedGroup);
    }

    this._activatePane(paneId);
    this._fireLayoutChange();
  }

  private _getOrCreateDefaultGroup(): IPaneGroup {
    if (this._paneGroups.size === 0) {
      const groupId = `group-${++this._groupCounter}`;
      const group: IPaneGroup = {
        id: groupId,
        panes: [],
        activePane: undefined,
        isActive: true,
      };
      this._paneGroups.set(groupId, group);
      this._activeGroupId = groupId;
      return group;
    }
    return this._paneGroups.get(this._activeGroupId!) ?? this._paneGroups.values().next().value!;
  }

  private _activatePane(paneId: string): void {
    const pane = this._panes.get(paneId);
    if (!pane)
      return;

    // Deactivate current active pane
    if (this._activePaneId) {
      const current = this._panes.get(this._activePaneId);
      if (current) {
        this._panes.set(this._activePaneId, { ...current, isActive: false });
      }
    }

    // Activate new pane
    this._panes.set(paneId, { ...pane, isActive: true });
    this._activePaneId = paneId;

    // Update active group
    for (const [groupId, group] of this._paneGroups) {
      if (group.panes.some(p => p.id === paneId)) {
        this._activeGroupId = groupId;
        this._paneGroups.set(groupId, { ...group, activePane: this._panes.get(paneId), isActive: true });
      }
      else {
        this._paneGroups.set(groupId, { ...group, isActive: false });
      }
    }

    this._onDidActivePaneChange.fire(this._panes.get(paneId));
  }

  private _getBaseName(path: string): string {
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1] || "/";
  }

  private _fireLayoutChange(): void {
    this._onDidChangeLayout.fire(this.layout);
  }
}
