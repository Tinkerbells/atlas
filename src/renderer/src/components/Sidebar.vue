<script setup lang="ts">
import {
  Clock,
  Globe,
  HardDrive,
  Home,
  Monitor,
  Trash2,
} from "@lucide/vue";

import { useFsStore } from "../stores/fs-store";

const emit = defineEmits<{ navigate: [path: string] }>();

const store = useFsStore();

interface NavItem {
  label: string;
  icon: typeof Home;
  path: string;
}

const places: NavItem[] = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Desktop", icon: Monitor, path: "/Desktop" },
  { label: "Recent", icon: Clock, path: "#recent" },
];

const devices: NavItem[] = [
  { label: "File System", icon: HardDrive, path: "/" },
  { label: "Trash", icon: Trash2, path: "#trash" },
];

const network: NavItem[] = [
  { label: "Network", icon: Globe, path: "#network" },
];

function isActive(path: string): boolean {
  return store.currentPath === path;
}
</script>

<template>
  <aside class="w-48 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col overflow-auto">
    <!-- Places -->
    <div class="p-2">
      <h3 class="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Places
      </h3>
      <nav class="mt-1 space-y-0.5">
        <button
          v-for="item in places"
          :key="item.label"
          class="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-md transition-colors"
          :class="isActive(item.path)
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          "
          @click="emit('navigate', item.path)"
        >
          <component :is="item.icon" class="size-4" />
          {{ item.label }}
        </button>
      </nav>
    </div>

    <!-- Devices -->
    <div class="p-2">
      <h3 class="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Devices
      </h3>
      <nav class="mt-1 space-y-0.5">
        <button
          v-for="item in devices"
          :key="item.label"
          class="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-md transition-colors"
          :class="isActive(item.path)
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          "
          @click="emit('navigate', item.path)"
        >
          <component :is="item.icon" class="size-4" />
          {{ item.label }}
        </button>
      </nav>
    </div>

    <!-- Network -->
    <div class="p-2">
      <h3 class="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Network
      </h3>
      <nav class="mt-1 space-y-0.5">
        <button
          v-for="item in network"
          :key="item.label"
          class="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-md transition-colors"
          :class="isActive(item.path)
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          "
          @click="emit('navigate', item.path)"
        >
          <component :is="item.icon" class="size-4" />
          {{ item.label }}
        </button>
      </nav>
    </div>
  </aside>
</template>
