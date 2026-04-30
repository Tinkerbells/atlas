<script setup lang="ts">
import { App } from "~/shared/ui/app";
import { useColorMode } from "~/shared/ui/composables/use-color-mode";

const { mode, toggle } = useColorMode();
</script>

<template>
  <App>
    <div class="app-layout">
      <header class="app-header">
        <h1>Atlas</h1>
        <button
          type="button"
          class="theme-toggle"
          :aria-label="mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggle"
        >
          <span v-if="mode === 'dark'">☀️</span>
          <span v-else>🌙</span>
        </button>
      </header>

      <main class="app-main">
        <p>App content goes here</p>
      </main>
    </div>
  </App>
</template>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-default);
  color: var(--color-default);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-elevated);

  h1 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-highlighted);
  }
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid var(--color-border-accented);
  border-radius: 0.5rem;
  background-color: var(--color-bg-default);
  color: var(--color-default);
  font-size: 1.25rem;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--color-bg-muted);
  }
}

.app-main {
  flex: 1;
  padding: 1.5rem;
}
</style>
