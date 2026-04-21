<script setup lang="ts">
import { onUnmounted } from "vue";

import KeypressVisualizer from "@/components/KeypressVisualizer.vue";
import { ContributionRegistry, createCoreContributions } from "@/contributions";
import { useCommands, useKeybindings, useLogger, useSettings } from "@/composables";

const logger = useLogger();
const { execute, commandRegistry } = useCommands();
const { get, settingsService } = useSettings();
const { keybindingService, keybindingsRegistry } = useKeybindings();

logger.info("Atlas Vue Desktop initialized", { scope: "App" });

const contributionRegistry = new ContributionRegistry(
  commandRegistry,
  keybindingsRegistry,
  keybindingService,
);

contributionRegistry.registerAll(createCoreContributions(logger, settingsService));

onUnmounted(() => {
  contributionRegistry.dispose();
});
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Atlas</h1>
      <nav>
        <button @click="execute('app.showInfo')">
          Info
        </button>
        <button @click="execute('editor.fontSize.increase')">
          Font +
        </button>
        <button @click="execute('editor.fontSize.decrease')">
          Font -
        </button>
        <button @click="execute('editor.fontSize.reset')">
          Font Reset
        </button>
        <button @click="execute('editor.toggleWordWrap')">
          Word Wrap
        </button>
        <button @click="execute('editor.toggleLineNumbers')">
          Line #
        </button>
        <button @click="execute('app.toggleLogging')">
          Log
        </button>
      </nav>
      <span class="status">
        Font: {{ get('fontSize') ?? 14 }}px
        | Wrap: {{ get('wordWrap') ? 'on' : 'off' }}
        | Lines: {{ (get('lineNumbers') ?? true) ? 'on' : 'off' }}
      </span>
    </header>
    <main class="app-main">
      <div class="main-grid">
        <div>
          <p>Atlas Vue Desktop — ready.</p>
          <div class="shortcuts">
            <h3>Keyboard Shortcuts</h3>
            <ul>
              <li><kbd>Ctrl+Shift+I</kbd> Show Info</li>
              <li><kbd>Ctrl+Shift+=</kbd> Increase Font</li>
              <li><kbd>Ctrl+-</kbd> Decrease Font</li>
              <li><kbd>Ctrl+0</kbd> Reset Font Size</li>
              <li><kbd>Alt+Z</kbd> Toggle Word Wrap</li>
              <li><kbd>Ctrl+Shift+L</kbd> Toggle Line Numbers</li>
              <li><kbd>Ctrl+Shift+K</kbd> Toggle Logging</li>
            </ul>
          </div>
        </div>
        <KeypressVisualizer />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border, #e5e4e7);
  flex-wrap: wrap;
}

.app-header h1 {
  margin: 0;
  font-size: 20px;
}

.status {
  margin-left: auto;
  color: var(--text-secondary, #666);
  font-size: 13px;
}

.app-main {
  flex: 1;
  padding: 24px;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.shortcuts {
  margin-top: 16px;
}

.shortcuts h3 {
  margin: 0 0 8px;
  font-size: 15px;
}

.shortcuts ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 4px;
}

.shortcuts li {
  font-size: 13px;
  color: var(--text-secondary, #555);
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 12px;
  font-family: inherit;
  background: var(--bg-secondary, #f5f5f5);
  border: 1px solid var(--border, #ddd);
  border-radius: 4px;
  min-width: 24px;
  text-align: center;
}
</style>
