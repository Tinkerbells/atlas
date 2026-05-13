<script setup lang="ts">
import type { ScanResult } from "@platform/common/file-index";

import { onMounted, watch } from "vue";
import { useIndexer } from "@renderer/modules/indexer";

const { state, status, progressPercent, refreshStats, startScan, cancelScan } = useIndexer();
const toast = useToast();

onMounted(() => {
  refreshStats();
});

watch(
  () => state.value.isScanning,
  (scanning, wasScanning) => {
    if (wasScanning && !scanning) {
      const hadErrors = state.value.errors.length > 0;
      if (hadErrors) {
        toast.add({
          title: "Indexing failed",
          description: state.value.errors.join("; "),
          icon: "i-lucide-circle-alert",
          color: "error",
          duration: 0,
        });
      }
      else {
        const total = state.value.lastScanResults?.reduce((s: number, r: ScanResult) => s + r.inserted + r.updated, 0) ?? 0;
        toast.add({
          title: "Indexing complete",
          description: `${total.toLocaleString()} files indexed`,
          icon: "i-lucide-check-circle",
          color: "success",
          duration: 0,
        });
      }
    }
  },
);

async function onRescan() {
  try {
    await startScan();
  }
  catch {
    // error handled by watcher
  }
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60)
    return "just now";
  if (minutes < 60)
    return `${minutes}m ago`;
  if (hours < 24)
    return `${hours}h ago`;
  if (days < 7)
    return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
</script>

<template>
  <div class="indexer-panel">
    <div class="indexer-panel__header">
      <div
        class="indexer-panel__status"
        :data-status="status"
      >
        <UIcon
          v-if="status === 'scanning'"
          name="i-lucide-loader-circle"
          class="indexer-panel__status-icon indexer-panel__status-icon--spinning"
        />
        <UIcon
          v-else-if="status === 'ready'"
          name="i-lucide-check"
          class="indexer-panel__status-icon"
        />
        <UIcon
          v-else
          name="i-lucide-circle-alert"
          class="indexer-panel__status-icon"
        />
        <span class="indexer-panel__status-text">{{ status }}</span>
      </div>
      <div class="indexer-panel__actions">
        <UButton
          v-if="state.isScanning"
          color="error"
          variant="outline"
          size="sm"
          @click="cancelScan"
        >
          <UIcon name="i-lucide-x" class="size-4" />
          Cancel
        </UButton>
        <UButton
          color="primary"
          variant="outline"
          size="sm"
          :disabled="state.isScanning"
          @click="onRescan"
        >
          <UIcon name="i-lucide-refresh-cw" :class="{ 'indexer-panel__spin': state.isScanning }" class="size-4" />
          Re-scan
        </UButton>
      </div>
    </div>

    <div
      v-if="state.isScanning"
      class="indexer-panel__progress"
    >
      <div class="indexer-panel__progress-info">
        <span class="indexer-panel__progress-label">Scanning</span>
        <span class="indexer-panel__progress-drive">{{ state.currentDrive }}</span>
        <span class="indexer-panel__progress-count">{{ state.scannedCount.toLocaleString() }}</span>
      </div>
      <UProgress
        :model-value="progressPercent ?? undefined"
        :animation="progressPercent === null ? 'carousel' : undefined"
        size="sm"
      />
    </div>

    <div class="indexer-panel__metrics">
      <div class="indexer-panel__metric">
        <span class="indexer-panel__metric-value">{{ state.stats?.totalFiles.toLocaleString() ?? "-" }}</span>
        <span class="indexer-panel__metric-label">Indexed items</span>
      </div>
      <div class="indexer-panel__metric">
        <span class="indexer-panel__metric-value">{{ state.stats?.totalDrives ?? "-" }}</span>
        <span class="indexer-panel__metric-label">Drives</span>
      </div>
      <div class="indexer-panel__metric">
        <span class="indexer-panel__metric-value">{{ state.lastScanTime ? formatRelativeTime(state.lastScanTime) : "-" }}</span>
        <span class="indexer-panel__metric-label">Last scan</span>
      </div>
    </div>

    <div
      v-if="state.errors.length > 0"
      class="indexer-panel__errors"
    >
      <div
        v-for="error in state.errors"
        :key="error"
        class="indexer-panel__error-item"
      >
        <UIcon name="i-lucide-circle-alert" class="indexer-panel__error-icon" />
        <span class="indexer-panel__error-text">{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.indexer-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.indexer-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.indexer-panel__actions {
  display: flex;
  gap: 0.5rem;
}

.indexer-panel__status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.indexer-panel__status[data-status="ready"] {
  background-color: rgb(var(--color-success) / 0.15);
  color: rgb(var(--color-success));
}

.indexer-panel__status[data-status="scanning"] {
  background-color: rgb(var(--color-primary) / 0.15);
  color: rgb(var(--color-primary));
}

.indexer-panel__status[data-status="outdated"] {
  background-color: rgb(var(--color-warning) / 0.15);
  color: rgb(var(--color-warning));
}

.indexer-panel__status[data-status="empty"],
.indexer-panel__status[data-status="error"] {
  background-color: rgb(var(--color-error) / 0.15);
  color: rgb(var(--color-error));
}

.indexer-panel__status-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.indexer-panel__status-icon--spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.indexer-panel__spin {
  animation: spin 1s linear infinite;
}

.indexer-panel__progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  background-color: rgb(var(--color-primary) / 0.08);
}

.indexer-panel__progress-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.indexer-panel__progress-label {
  color: var(--color-muted);
}

.indexer-panel__progress-drive {
  color: var(--color-highlighted);
  font-family: ui-monospace, monospace;
  font-weight: 500;
}

.indexer-panel__progress-count {
  margin-left: auto;
  color: var(--color-muted);
  font-size: 0.75rem;
}

.indexer-panel__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.indexer-panel__metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-card);
  text-align: center;
}

.indexer-panel__metric-value {
  color: var(--color-highlighted);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.2;
}

.indexer-panel__metric-label {
  color: var(--color-muted);
  font-size: 0.6875rem;
  text-transform: uppercase;
}

.indexer-panel__errors {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.indexer-panel__error-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid rgb(var(--color-error) / 0.3);
  border-radius: var(--radius-sm);
  background-color: rgb(var(--color-error) / 0.06);
}

.indexer-panel__error-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: rgb(var(--color-error));
}

.indexer-panel__error-text {
  color: var(--color-muted);
  font-size: 0.75rem;
}

@media (max-width: 520px) {
  .indexer-panel__metrics {
    grid-template-columns: 1fr;
  }

  .indexer-panel__header {
    flex-direction: column;
    align-items: stretch;
  }

  .indexer-panel__status {
    justify-content: center;
  }

  .indexer-panel__actions {
    justify-content: stretch;
  }

  .indexer-panel__actions > * {
    flex: 1;
  }
}
</style>
