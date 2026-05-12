<script setup lang="ts">
import { computed, ref } from "vue";
import { URI } from "@platform/common/uri/uri";
import { isWindows } from "@core/base/platform";
import { useService } from "@renderer/composables/use-service";
import { IFileIndexService } from "@platform/common/file-index";
import { CancellationTokenSource } from "@platform/common/cancellation";

const open = ref(false);
const fileIndexService = useService(IFileIndexService);

const isScanning = ref(false);
const currentDrive = ref("");
const scanned = ref(0);
const estimatedTotal = ref<number | undefined>(undefined);
const startTime = ref(0);
const lastUpdateTime = ref(0);
const speed = ref(0); // files per second

const progressPercent = computed(() => {
  if (!estimatedTotal.value || estimatedTotal.value === 0) {
    return null;
  }
  return Math.min(100, Math.round((scanned.value / estimatedTotal.value) * 100));
});

const etaText = computed(() => {
  if (!estimatedTotal.value || speed.value <= 0) {
    return "calculating...";
  }
  const remaining = estimatedTotal.value - scanned.value;
  const seconds = Math.ceil(remaining / speed.value);
  if (seconds < 60) {
    return `${seconds}s remaining`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes}m remaining`;
});

const statusText = computed(() => {
  if (!isScanning.value) {
    return scanned.value > 0 ? `Last scan: ${scanned.value.toLocaleString()} files` : "Ready to scan";
  }
  if (!estimatedTotal.value) {
    return `Scanned ${scanned.value.toLocaleString()} files...`;
  }
  return `Scanned ${scanned.value.toLocaleString()} / ~${estimatedTotal.value.toLocaleString()} (${progressPercent.value}%)`;
});

let cancelSource: CancellationTokenSource | null = null;
let progressDisposable: { dispose: () => void } | null = null;

function startIndexing() {
  const drives = detectDrives();
  console.log("[DriveIndexer] drives to scan:", drives.map(d => d.fsPath));
  if (drives.length === 0) {
    console.warn("[DriveIndexer] no drives detected");
    return;
  }

  isScanning.value = true;
  scanned.value = 0;
  estimatedTotal.value = undefined;
  speed.value = 0;
  startTime.value = Date.now();
  lastUpdateTime.value = Date.now();
  currentDrive.value = drives[0]!.fsPath;

  cancelSource = new CancellationTokenSource();
  console.log("[DriveIndexer] calling scanDrives with", drives.length, "drive(s)");

  // Subscribe to progress events
  progressDisposable = fileIndexService.onDidProgress((progress) => {
    console.log("[DriveIndexer] progress event:", progress);
    scanned.value = progress.scanned;
    if (progress.total) {
      estimatedTotal.value = progress.total;
    }

    const now = Date.now();
    const elapsed = (now - startTime.value) / 1000;
    if (elapsed > 0) {
      speed.value = progress.scanned / elapsed;
    }
    lastUpdateTime.value = now;
  });

  const scanPromise = fileIndexService.scanDrives(drives);

  const timeoutId = setTimeout(() => {
    if (isScanning.value) {
      console.warn("[DriveIndexer] scan is still running after 10s — possible hang");
    }
  }, 10000);

  scanPromise
    .then((results) => {
      const total = results.reduce((sum, r) => sum + r.inserted + r.updated, 0);
      console.log("[DriveIndexer] scan completed:", results, "total processed:", total);
      scanned.value = total;
    })
    .catch((err) => {
      console.error("[DriveIndexer] scan failed:", err);
    })
    .finally(() => {
      clearTimeout(timeoutId);
      console.log("[DriveIndexer] scan finally block");
      isScanning.value = false;
      progressDisposable?.dispose();
      progressDisposable = null;
      cancelSource = null;
    });
}

function stopIndexing() {
  cancelSource?.cancel();
}

function detectDrives(): URI[] {
  if (isWindows) {
    // On Windows, scan C: drive for now
    return [URI.file("C:")];
  }
  return [URI.file("/")];
}

function show() {
  open.value = true;
}

function onOpenChange(value: boolean) {
  open.value = value;
}

defineExpose({ show });
</script>

<template>
  <UModal :open="open" @update:open="onOpenChange">
    <template #content>
      <div class="flex flex-col gap-4 p-4 w-96">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">
            Index Drives
          </h2>
          <UButton
            v-if="isScanning"
            color="error"
            variant="soft"
            size="sm"
            @click="stopIndexing"
          >
            Stop
          </UButton>
          <UButton
            v-else
            color="primary"
            size="sm"
            @click="startIndexing"
          >
            Start Indexing
          </UButton>
        </div>

        <div class="text-sm text-dimmed">
          {{ statusText }}
        </div>

        <UProgress
          :model-value="progressPercent"
          :status="true"
          :animation="progressPercent === null ? 'carousel' : undefined"
          class="w-full"
        />

        <div
          v-if="isScanning && estimatedTotal"
          class="flex justify-between text-xs text-muted"
        >
          <span>Speed: {{ Math.round(speed).toLocaleString() }} files/s</span>
          <span>{{ etaText }}</span>
        </div>

        <div
          v-if="currentDrive && isScanning"
          class="text-xs text-muted"
        >
          Scanning: {{ currentDrive }}
        </div>
      </div>
    </template>
  </UModal>
</template>
