<script setup lang="ts">
import Icon from "./Icon.vue";

withDefaults(
  defineProps<{
    color?: "error" | "warning" | "info";
    title?: string;
  }>(),
  {
    color: "info",
  },
);

const emit = defineEmits<{ close: [] }>();

const colorMap = {
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: "text-red-500",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    icon: "text-amber-500",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: "text-blue-500",
  },
};
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-lg border p-3"
    :class="[colorMap[color].bg, colorMap[color].border]"
  >
    <Icon
      name="i-lucide-alert-circle"
      class="mt-0.5 size-5 shrink-0"
      :class="colorMap[color].icon"
    />
    <div class="flex-1 min-w-0">
      <p v-if="title" class="text-sm font-medium" :class="colorMap[color].text">
        {{ title }}
      </p>
      <slot />
    </div>
    <button
      v-if="$slots.close || $attrs.closable"
      class="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      @click="emit('close')"
    >
      <span class="sr-only">Close</span>
      &times;
    </button>
  </div>
</template>
