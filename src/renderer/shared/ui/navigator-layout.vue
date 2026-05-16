<script setup lang="ts">
export interface NavigatorPane {
  id: string;
  type: number;
  title: string;
  isActive: boolean;
}

export interface NavigatorPaneGroup {
  id: string;
  panes: NavigatorPane[];
  isActive: boolean;
}

export interface NavigatorLayoutProps {
  paneGroups: NavigatorPaneGroup[];
  activePaneTitle?: string;
}

defineProps<NavigatorLayoutProps>();

const emit = defineEmits<{
  (e: "paneClick", paneId: string): void;
  (e: "paneClose", paneId: string): void;
}>();

function getPaneIcon(type: number): string {
  switch (type) {
    case 1:
      return "i-lucide-folder-open";
    case 2:
      return "i-lucide-columns-2";
    case 3:
      return "i-lucide-eye";
    case 4:
      return "i-lucide-terminal";
    default:
      return "i-lucide-file";
  }
}

function onPaneClick(pane: NavigatorPane): void {
  emit("paneClick", pane.id);
}

function onPaneClose(pane: NavigatorPane): void {
  emit("paneClose", pane.id);
}

function getTotalPanes(groups: NavigatorPaneGroup[]): number {
  return groups.reduce((acc, g) => acc + g.panes.length, 0);
}
</script>

<template>
  <div class="flex flex-col h-screen w-screen bg-background">
    <!-- Title bar / Tab bar -->
    <div class="flex items-center border-b bg-surface">
      <div v-for="group in paneGroups" :key="group.id" class="flex flex-1">
        <div
          v-for="pane in group.panes"
          :key="pane.id"
          class="tab-item flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none border-r min-w-0 transition-colors relative"
          :class="pane.isActive ? 'tab-active' : 'tab-inactive'"
          @click="onPaneClick(pane)"
        >
          <UIcon :name="getPaneIcon(pane.type)" class="w-4 h-4 shrink-0" />
          <span class="text-sm truncate max-w-48 font-medium">{{ pane.title }}</span>
          <button
            class="tab-close ml-1 flex items-center justify-center w-5 h-5 rounded-md opacity-0 transition-opacity"
            @click.stop="onPaneClose(pane)"
          >
            <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Content area -->
    <div class="flex flex-1 overflow-hidden bg-background">
      <div
        v-for="(group, index) in paneGroups"
        :key="group.id"
        class="flex-1 flex flex-col border-r last:border-r-0"
        :class="group.isActive ? 'ring-1 ring-inset ring-primary/10' : ''"
      >
        <slot :name="`group-${index}`" :group="group">
          <div class="flex-1 flex items-center justify-center text-muted">
            No active pane
          </div>
        </slot>
      </div>
    </div>

    <!-- Status bar -->
    <div class="flex items-center justify-between px-3 py-1.5 border-t bg-surface text-xs">
      <div class="flex items-center gap-4">
        <span class="text-muted">{{ getTotalPanes(paneGroups) }} pane(s)</span>
        <span v-if="activePaneTitle" class="text-foreground font-medium">{{ activePaneTitle }}</span>
      </div>
      <div class="flex items-center gap-4">
        <slot name="status-right">
          <span class="text-muted">Atlas Navigator</span>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tab-item {
  &:hover {
    .tab-close {
      opacity: 1;
    }
  }
}

.tab-active {
  background-color: var(--color-bg-default);
  color: var(--color-highlighted);

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--color-primary);
  }
}

.tab-inactive {
  background-color: var(--color-bg-muted);
  color: var(--color-muted);

  &:hover {
    background-color: var(--color-bg-elevated);
    color: var(--color-default);
  }
}

.tab-close {
  color: var(--color-muted);

  &:hover {
    background-color: var(--color-bg-accented);
    color: var(--color-default);
  }
}
</style>
