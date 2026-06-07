<script setup lang="ts">
import { ChevronRight } from "@lucide/vue";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

defineProps<{
  items: BreadcrumbItem[];
}>();

const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <nav class="flex items-center gap-1 text-sm min-w-0 overflow-hidden" aria-label="Breadcrumb">
    <template v-for="(item, index) in items" :key="item.path ?? item.label">
      <ChevronRight
        v-if="index > 0"
        class="size-4 shrink-0 text-gray-400"
      />
      <button
        v-if="item.path"
        class="px-1 py-0.5 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors truncate"
        @click="emit('navigate', item.path)"
      >
        {{ item.label }}
      </button>
      <span v-else class="px-1 py-0.5 text-gray-900 font-medium truncate">
        {{ item.label }}
      </span>
    </template>
  </nav>
</template>
