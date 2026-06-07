<script setup lang="ts">
import FileExplorer from "./components/FileExplorer.vue";
import ToastContainer from "./components/ToastContainer.vue";
import ColorModeToggle from "./components/ColorModeToggle.vue";
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <div class="fixed top-4 right-4 z-50">
      <ColorModeToggle />
    </div>
    <main class="h-screen flex flex-col py-16 px-6">
      <div class="flex-1 flex flex-col min-h-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <FileExplorer />
      </div>
    </main>
    <ToastContainer />
  </div>
</template>
