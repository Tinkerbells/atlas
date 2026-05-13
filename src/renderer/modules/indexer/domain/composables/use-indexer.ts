import type { ScanProgress, ScanResult } from "@platform/common/file-index";

import { computed, ref } from "vue";
import { URI } from "@platform/common/uri/uri";
import { isWindows } from "@core/base/platform";
import { useService } from "@renderer/composables/use-service";
import { IFileIndexService } from "@platform/common/file-index";

export interface IndexerState {
  isScanning: boolean;
  scannedCount: number;
  estimatedTotal: number | undefined;
  currentDrive: string;
  totalDrives: number;
  scannedDrives: number;
  stats: { totalFiles: number; totalDrives: number } | null;
  lastScanTime: number | null;
  lastScanResults: ScanResult[] | null;
  errors: string[];
}

let progressDisposable: { dispose: () => void } | null = null;

const state = ref<IndexerState>({
  isScanning: false,
  scannedCount: 0,
  estimatedTotal: undefined,
  currentDrive: "",
  totalDrives: 0,
  scannedDrives: 0,
  stats: null,
  lastScanTime: null,
  lastScanResults: null,
  errors: [],
});

export function useIndexer() {
  const fileIndexService = useService(IFileIndexService);

  const progressPercent = computed(() => {
    if (!state.value.estimatedTotal || state.value.estimatedTotal === 0)
      return null;
    return Math.min(100, Math.round((state.value.scannedCount / state.value.estimatedTotal) * 100));
  });

  const status = computed(() => {
    if (state.value.isScanning)
      return "scanning";
    if (state.value.errors.length > 0 && !state.value.stats?.totalFiles)
      return "error";
    if (!state.value.stats || state.value.stats.totalFiles === 0)
      return "empty";
    if (state.value.lastScanTime) {
      const hoursSince = (Date.now() - state.value.lastScanTime) / (1000 * 60 * 60);
      if (hoursSince > 24)
        return "outdated";
    }
    return "ready";
  });

  async function refreshStats() {
    try {
      const stats = await fileIndexService.getStats();
      state.value.stats = stats;
    }
    catch (err) {
      console.error("[useIndexer] failed to get stats:", err);
    }
  }

  function detectDrives(): URI[] {
    if (isWindows)
      return [URI.file("C:")];
    return [URI.file("/")];
  }

  async function startScan(): Promise<ScanResult[]> {
    const drives = detectDrives();
    if (drives.length === 0) {
      console.warn("[useIndexer] no drives detected");
      return [];
    }

    state.value.isScanning = true;
    state.value.scannedCount = 0;
    state.value.estimatedTotal = undefined;
    state.value.currentDrive = drives[0]!.fsPath;
    state.value.totalDrives = drives.length;
    state.value.scannedDrives = 0;
    state.value.errors = [];

    progressDisposable = fileIndexService.onDidProgress((progress: ScanProgress) => {
      state.value.scannedCount = progress.scanned;
      if (progress.total)
        state.value.estimatedTotal = progress.total;
      state.value.currentDrive = progress.drive;
    });

    try {
      const results = await fileIndexService.scanDrives(drives);
      state.value.lastScanResults = results;
      state.value.lastScanTime = Date.now();
      state.value.scannedDrives = drives.length;
      await refreshStats();
      return results;
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      state.value.errors.push(message);
      console.error("[useIndexer] scan failed:", err);
      throw err;
    }
    finally {
      state.value.isScanning = false;
      progressDisposable?.dispose();
      progressDisposable = null;
    }
  }

  async function cancelScan() {
    fileIndexService.cancelCurrentScan();
  }

  return {
    state,
    status,
    progressPercent,
    refreshStats,
    startScan,
    cancelScan,
  };
}
