<script setup lang="ts">
import { computed, watch } from "vue";
import { URI } from "@platform/common/uri/uri";
import { useRoute, useRouter } from "vue-router";
import { useService } from "@renderer/composables/use-service";
import { INavigatorService, Navigator } from "@renderer/navigator";
import { INavigatorHistoryService } from "@renderer/navigator/history";
import NavigatorHistoryControls from "@renderer/components/navigator-history-controls.vue";

const navigatorService = useService(INavigatorService);
const historyService = useService(INavigatorHistoryService);

const route = useRoute();
const router = useRouter();

const activePane = computed(() => {
  for (const group of navigatorService.layout.paneGroups) {
    if (group.activePane)
      return group.activePane;
  }
  return undefined;
});

// Sync URL -> Navigator on mount and when query changes
watch(
  () => route.query.path,
  (path) => {
    if (typeof path === "string" && path) {
      const uri = URI.file(path);
      // Only navigate if different from current active pane
      const currentResource = activePane.value?.resource;
      if (!currentResource || currentResource.path !== uri.path) {
        if (activePane.value) {
          navigatorService.navigateActivePane(uri);
        }
        else {
          navigatorService.openPane(uri, { title: path });
        }
      }
    }
    else if (!activePane.value) {
      // No path in URL and no active pane — open /home by default
      const homeUri = URI.file("/home");
      navigatorService.openPane(homeUri, { title: "/home" });
    }
  },
  { immediate: true },
);

// Sync Navigator -> URL when active pane resource changes
navigatorService.onDidActivePaneResourceChange(({ resource }) => {
  const currentPath = route.query.path;
  if (currentPath !== resource.path) {
    router.replace({ query: { path: resource.path } });
  }

  // Add to history
  const pane = activePane.value;
  if (pane) {
    const groupId = navigatorService.layout.activePaneGroup?.id ?? "";
    historyService.addEntry(resource, pane.id, groupId);
  }
});

// Also track initial pane opens
navigatorService.onDidActivePaneChange((pane) => {
  if (pane?.resource) {
    const groupId = navigatorService.layout.activePaneGroup?.id ?? "";
    historyService.addEntry(pane.resource, pane.id, groupId);
  }
});
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home">
        <template #leading>
          <div class="flex items-center gap-1">
            <NavigatorHistoryControls />
            <UDashboardSidebarCollapse />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <Navigator />
    </template>
  </UDashboardPanel>
</template>
