<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { INavigatorService } from "@renderer/navigator";
import { useService } from "@renderer/composables/use-service";
import { useCommands } from "@renderer/composables/use-commands";
import { ScanCode } from "@platform/keybindings/renderer/scan-code";
import { useKeybindings } from "@renderer/composables/use-keybindings";
import { INavigatorHistoryService } from "@renderer/navigator/history";
import { ScanCodeMod } from "@platform/keybindings/renderer/keybindings";

import DriveIndexer from "./components/drive-indexer.vue";
import QuickFileAccess from "./components/quick-file-access.vue";

const router = useRouter();
const navigatorService = useService(INavigatorService);
const historyService = useService(INavigatorHistoryService);

const quickFileAccessRef = ref<InstanceType<typeof QuickFileAccess> | null>(null);
const driveIndexerRef = ref<InstanceType<typeof DriveIndexer> | null>(null);

const { register: registerCommand } = useCommands();
const { registerKeybinding } = useKeybindings();

onMounted(() => {
  // Auto-start indexing on launch
  setTimeout(() => {
    driveIndexerRef.value?.startIndexing();
  }, 500);

  // Register command: Quick File Access (Ctrl+K)
  registerCommand("fileManager.quickFileAccess", () => {
    quickFileAccessRef.value?.show();
  });

  registerKeybinding({
    id: "fileManager.quickFileAccess",
    weight: 0,
    when: undefined,
    primary: ScanCodeMod.CtrlCmd | ScanCode.KeyK,
  });

  // Register command: Drive Indexer (Ctrl+Shift+K)
  registerCommand("fileManager.openDriveIndexer", () => {
    driveIndexerRef.value?.show();
  });

  registerKeybinding({
    id: "fileManager.openDriveIndexer",
    weight: 0,
    when: undefined,
    primary: ScanCodeMod.CtrlCmd | ScanCodeMod.Shift | ScanCode.KeyK,
  });

  // Register command: Settings (Ctrl+,)
  registerCommand("fileManager.openSettings", () => {
    router.push("/settings");
  });

  registerKeybinding({
    id: "fileManager.openSettings",
    weight: 0,
    when: undefined,
    primary: ScanCodeMod.CtrlCmd | ScanCode.Comma,
  });

  // Register command: Go Back (Alt+Left)
  registerCommand("navigator.goBack", () => {
    const entry = historyService.goBack();
    if (entry) {
      navigatorService.navigateActivePane(entry.resource);
    }
  });

  registerKeybinding({
    id: "navigator.goBack",
    weight: 0,
    when: undefined,
    primary: ScanCodeMod.Alt | ScanCode.ArrowLeft,
  });

  // Register command: Go Forward (Alt+Right)
  registerCommand("navigator.goForward", () => {
    const entry = historyService.goForward();
    if (entry) {
      navigatorService.navigateActivePane(entry.resource);
    }
  });

  registerKeybinding({
    id: "navigator.goForward",
    weight: 0,
    when: undefined,
    primary: ScanCodeMod.Alt | ScanCode.ArrowRight,
  });
});
</script>

<template>
  <UApp>
    <RouterView />
    <QuickFileAccess ref="quickFileAccessRef" />
    <DriveIndexer ref="driveIndexerRef" />
  </UApp>
</template>
