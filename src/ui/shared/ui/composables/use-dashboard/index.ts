import type { InjectionKey, Ref } from "vue";

import { inject, provide, ref } from "vue";

export interface DashboardContext {
  storageKey: string;
  unit: string;
  sidebarOpen: Ref<boolean>;
  sidebarCollapsed: Ref<boolean>;
  toggleSidebar: () => void;
  collapseSidebar: (value?: boolean) => void;
}

export const dashboardInjectionKey: InjectionKey<DashboardContext> = Symbol("dashboard");

export function useDashboard(context?: Partial<DashboardContext>): DashboardContext {
  const parent = inject(dashboardInjectionKey, undefined);

  if (parent) {
    return parent;
  }

  const storageKey = context?.storageKey || "dashboard";
  const unit = context?.unit || "%";
  const sidebarOpen = context?.sidebarOpen || ref(false);
  const sidebarCollapsed = context?.sidebarCollapsed || ref(false);

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
  }

  function collapseSidebar(value?: boolean) {
    sidebarCollapsed.value = value ?? !sidebarCollapsed.value;
  }

  const dashboardContext: DashboardContext = {
    storageKey,
    unit,
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    collapseSidebar,
  };

  provide(dashboardInjectionKey, dashboardContext);

  return dashboardContext;
}
