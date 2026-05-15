<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { INavigatorService } from "@renderer/navigator";
import { useService } from "@renderer/composables/use-service";
import { INavigatorHistoryService } from "@renderer/navigator/history";

const navigatorService = useService(INavigatorService);
const historyService = useService(INavigatorHistoryService);

const canGoBack = ref(historyService.canGoBack);
const canGoForward = ref(historyService.canGoForward);

historyService.onDidChange(() => {
  canGoBack.value = historyService.canGoBack;
  canGoForward.value = historyService.canGoForward;
});

function goBack(): void {
  const entry = historyService.goBack();
  if (entry) {
    navigatorService.navigateActivePane(entry.resource);
  }
}

function goForward(): void {
  const entry = historyService.goForward();
  if (entry) {
    navigatorService.navigateActivePane(entry.resource);
  }
}

function onMouseDown(event: MouseEvent): void {
  // Mouse button 4 = back, button 5 = forward
  if (event.button === 3) {
    event.preventDefault();
    goBack();
  }
  else if (event.button === 4) {
    event.preventDefault();
    goForward();
  }
}

onMounted(() => {
  window.addEventListener("mousedown", onMouseDown);
});

onUnmounted(() => {
  window.removeEventListener("mousedown", onMouseDown);
});
</script>

<template>
  <div class="flex items-center">
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-chevron-left"
      size="sm"
      :disabled="!canGoBack"
      @click="goBack"
    />
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-chevron-right"
      size="sm"
      :disabled="!canGoForward"
      @click="goForward"
    />
  </div>
</template>
