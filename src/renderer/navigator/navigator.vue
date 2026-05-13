<script setup lang="ts">
import type { IPane } from "@renderer/navigator/navigator";

import { computed, ref } from "vue";
import { useService } from "@renderer/composables/use-service";
import { INavigatorService } from "@renderer/navigator/navigator";

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

function onPaneClick(pane: IPane) {
  navigatorService.activatePane(pane.id);
}

function onPaneClose(pane: IPane) {
  navigatorService.closePane(pane.id);
}

function getPaneIcon(type: number): string {
  switch (type) {
    case 1: return "folder-open";
    case 2: return "columns-2";
    case 3: return "eye";
    case 4: return "terminal";
    default: return "file";
  }
}
</script>

<template>
  <div class="flex flex-col h-screen w-screen">
    <!-- Title bar / Tab bar -->
    <div class="flex items-center border-b bg-surface">
      <div v-for="group in paneGroups" :key="group.id" class="flex flex-1">
        <div
          v-for="pane in group.panes" :key="pane.id"
          class="flex items-center gap-2 px-3 py-2 cursor-pointer select-none border-r transition-colors"
          :class="pane.isActive ? 'bg-background text-foreground' : 'bg-surface text-muted hover:bg-surface-hover'"
          @click="onPaneClick(pane)"
        >
          <span :class="`i-lucide-${getPaneIcon(pane.type)}`" class="w-4 h-4" />
          <span class="text-sm truncate max-w-48">{{ pane.title }}</span>
          <button
            class="w-4 h-4 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive ml-1"
            @click.stop="onPaneClose(pane)"
          >
            <span class="i-lucide-x w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Content area -->
    <div class="flex flex-1 overflow-hidden">
      <div
        v-for="group in paneGroups" :key="group.id" class="flex-1 flex flex-col border-r last:border-r-0"
        :class="group.isActive ? 'ring-1 ring-inset ring-primary/20' : ''"
      >
        <div v-if="group.activePane" class="flex-1 p-4 overflow-auto">
          <div class="text-sm text-muted mb-2">
            {{ group.activePane.resource?.path }}
          </div>
          <div class="text-dimmed">
            Pane content will be rendered here based on type: {{ group.activePane.type }}
          </div>
        </div>
        <div v-else class="flex-1 flex items-center justify-center text-muted">
          No active pane
        </div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="flex items-center justify-between px-3 py-1.5 border-t bg-surface text-xs text-muted">
      <div class="flex items-center gap-4">
        <span>{{ paneGroups.length }} group(s)</span>
        <span v-if="activePane">{{ activePane.title }}</span>
      </div>
      <div class="flex items-center gap-4">
        <span>Atlas Navigator</span>
      </div>
    </div>
  </div>
</template>
