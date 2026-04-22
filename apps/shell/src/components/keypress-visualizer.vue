<script setup lang="ts">
import type { KeypressEvent } from "~/services/keybindings/keypress-event-bus";

import { computed } from "vue";
import { useKeypress } from "~/composables";

const { history, last, clear } = useKeypress({ maxLength: 50 });

function formatLabel(e: KeypressEvent): string {
  return e.resolvedLabel || buildLabel(e);
}

function buildLabel(e: KeypressEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey)
    parts.push("Ctrl");
  if (e.metaKey)
    parts.push("Meta");
  if (e.altKey)
    parts.push("Alt");
  if (e.shiftKey)
    parts.push("Shift");
  parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
  return parts.join("+");
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function resultIcon(e: KeypressEvent): string {
  switch (e.resultKind) {
    case "found": return "\u2713";
    case "moreChords": return "\u2026";
    default: return "\u2013";
  }
}

function resultClass(e: KeypressEvent): string {
  switch (e.resultKind) {
    case "found": return "matched";
    case "moreChords": return "chord";
    default: return "unmatched";
  }
}

const isEmpty = computed(() => history.value.length === 0);
</script>

<template>
  <div class="keypress-visualizer">
    <div class="header">
      <h3>Keypresses</h3>
      <button v-if="!isEmpty" class="clear-btn" @click="clear">
        Clear
      </button>
    </div>

    <div v-if="last" class="current">
      <kbd class="current-kbd">{{ formatLabel(last) }}</kbd>
      <span v-if="last.commandId" class="command-badge">{{ last.commandId }}</span>
      <span class="result-badge" :class="[resultClass(last)]">{{ resultIcon(last) }}</span>
    </div>

    <div v-if="isEmpty" class="empty">
      Press any key to see it here
    </div>

    <ul v-else class="history">
      <li v-for="entry in history" :key="entry.timestamp" class="entry">
        <span class="time">{{ formatTime(entry.timestamp) }}</span>
        <kbd>{{ formatLabel(entry) }}</kbd>
        <span v-if="entry.commandId" class="command">{{ entry.commandId }}</span>
        <span v-else class="command none">(no command)</span>
        <span class="result" :class="[resultClass(entry)]">{{ resultIcon(entry) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.keypress-visualizer {
  border: 1px solid var(--border, #e5e4e7);
  border-radius: 8px;
  padding: 16px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.header h3 {
  margin: 0;
  font-size: 15px;
}

.clear-btn {
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid var(--border, #ddd);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary, #666);
}

.clear-btn:hover {
  background: var(--bg-secondary, #f5f5f5);
}

.current {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-bottom: 12px;
  background: var(--bg-secondary, #f9f9fb);
  border-radius: 6px;
  border: 1px solid var(--border, #e5e4e7);
}

.current-kbd {
  font-size: 16px;
  padding: 4px 10px;
}

.command-badge {
  font-size: 12px;
  font-family: inherit;
  padding: 2px 8px;
  border-radius: 10px;
  background: #e8f5e9;
  color: #2e7d32;
}

.result-badge {
  margin-left: auto;
  font-size: 16px;
}

.result-badge.matched { color: #2e7d32; }
.result-badge.chord { color: #f57c00; }
.result-badge.unmatched { color: #9e9e9e; }

.empty {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary, #999);
  font-size: 13px;
}

.history {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
  display: grid;
  gap: 2px;
}

.entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  font-size: 13px;
  border-radius: 4px;
}

.entry:hover {
  background: var(--bg-secondary, #f5f5f5);
}

.time {
  color: var(--text-secondary, #aaa);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  min-width: 64px;
}

kbd {
  display: inline-block;
  padding: 1px 6px;
  font-size: 12px;
  font-family: inherit;
  background: var(--bg-secondary, #f0f0f0);
  border: 1px solid var(--border, #ddd);
  border-radius: 4px;
  min-width: 24px;
  text-align: center;
}

.command {
  flex: 1;
  font-size: 12px;
  color: var(--text-secondary, #555);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.command.none {
  color: #bbb;
  font-style: italic;
}

.result {
  font-size: 14px;
}

.result.matched { color: #2e7d32; }
.result.chord { color: #f57c00; }
.result.unmatched { color: #bdbdbd; }
</style>
