<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useCommands } from "@renderer/composables/use-commands";
import { ScanCode } from "@platform/keybindings/renderer/scan-code";
import { useKeybindings } from "@renderer/composables/use-keybindings";
import { ScanCodeMod } from "@platform/keybindings/renderer/keybindings";

import DriveIndexer from "./components/drive-indexer.vue";
import QuickFileAccess from "./components/quick-file-access.vue";

const quickFileAccessRef = ref<InstanceType<typeof QuickFileAccess> | null>(null);
const driveIndexerRef = ref<InstanceType<typeof DriveIndexer> | null>(null);

const { register: registerCommand } = useCommands();
const { registerKeybinding } = useKeybindings();

onMounted(() => {
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
});
</script>

<template>
  <UApp>
    <QuickFileAccess ref="quickFileAccessRef" />
    <DriveIndexer ref="driveIndexerRef" />

    <div class="flex flex-col gap-4 p-4">
      <div>Atlas File Manager</div>

      <p class="text-sm text-dimmed">
        Press <kbd class="px-1 py-0.5 border rounded text-xs">Ctrl+K</kbd> to open Quick File Access
      </p>
      <p class="text-sm text-dimmed">
        Press <kbd class="px-1 py-0.5 border rounded text-xs">Ctrl+Shift+K</kbd> to open Drive Indexer
      </p>
    </div>
  </UApp>
</template>
