<script setup lang="ts">
import { computed, ref } from "vue";
import { useService } from "@renderer/composables/use-service";
import { INavigatorService } from "@renderer/navigator/navigator";
import PaneExplorer from "@renderer/components/pane-explorer.vue";
import NavigatorLayout from "@renderer/shared/ui/navigator-layout.vue";
import PaneBreadcrumbs from "@renderer/components/pane-breadcrumbs.vue";

const navigatorService = useService(INavigatorService);

const layout = ref(navigatorService.layout);

navigatorService.onDidChangeLayout((newLayout) => {
  layout.value = newLayout;
});

const paneGroups = computed(() => layout.value.paneGroups);
const activePane = computed(() => {
  for (const group of paneGroups.value) {
    if (group.activePane)
      return group.activePane;
  }
  return undefined;
});

const uiPaneGroups = computed(() => {
  return paneGroups.value.map(group => ({
    id: group.id,
    isActive: group.isActive,
    panes: group.panes.map(pane => ({
      id: pane.id,
      type: pane.type,
      title: pane.title,
      isActive: pane.isActive,
    })),
  }));
});

function onPaneClick(paneId: string) {
  navigatorService.activatePane(paneId);
}

function onPaneClose(paneId: string) {
  navigatorService.closePane(paneId);
}
</script>

<template>
  <NavigatorLayout
    :pane-groups="uiPaneGroups"
    :active-pane-title="activePane?.title"
    @pane-click="onPaneClick"
    @pane-close="onPaneClose"
  >
    <template v-for="(group, index) in paneGroups" :key="group.id" #[`group-${index}`]>
      <div v-if="group.activePane" class="flex-1 flex flex-col overflow-hidden">
        <PaneBreadcrumbs :resource="group.activePane.resource" />
        <PaneExplorer :resource="group.activePane.resource" />
      </div>
      <div v-else class="flex-1 flex items-center justify-center text-muted">
        No active pane
      </div>
    </template>
  </NavigatorLayout>
</template>
