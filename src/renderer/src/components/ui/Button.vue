<script setup lang="ts">
import { computed } from "vue";

import Icon from "./Icon.vue";

const props = withDefaults(
  defineProps<{
    variant?: "solid" | "ghost" | "link" | "outline";
    color?: "primary" | "neutral" | "error";
    size?: "sm" | "md";
    icon?: string;
    disabled?: boolean;
    type?: "button" | "submit";
  }>(),
  {
    variant: "solid",
    color: "primary",
    size: "md",
    type: "button",
  },
);

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const classes = computed(() => {
  const base
    = "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-2 py-1 text-xs rounded",
    md: "px-3 py-1.5 text-sm rounded-md",
  };

  const colorMap = {
    primary: {
      solid: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      ghost: "text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
      link: "text-blue-600 hover:underline focus:ring-blue-500 px-1",
      outline:
        "border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    },
    neutral: {
      solid: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-400",
      link: "text-gray-700 hover:underline focus:ring-gray-400 px-1",
      outline:
        "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400",
    },
    error: {
      solid: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      ghost: "text-red-600 hover:bg-red-50 focus:ring-red-500",
      link: "text-red-600 hover:underline focus:ring-red-500 px-1",
      outline:
        "border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500",
    },
  };

  const variantClass = colorMap[props.color][props.variant];
  return `${base} ${sizeClasses[props.size]} ${variantClass}`;
});
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled"
    @click="(e) => emit('click', e)"
  >
    <Icon v-if="icon" :name="icon" class="size-4" />
    <slot />
  </button>
</template>
