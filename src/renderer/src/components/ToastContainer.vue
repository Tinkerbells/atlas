<script setup lang="ts">
import Icon from "./ui/Icon.vue";
import { useToastStore } from "../stores/toast-store";

const store = useToastStore();

const colorMap = {
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
};
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in store.toasts"
        :key="toast.id"
        class="pointer-events-auto max-w-sm rounded-lg border p-3 shadow-lg flex items-start gap-2"
        :class="colorMap[toast.color ?? 'info']"
      >
        <Icon
          :name="toast.color === 'error' ? 'i-lucide-alert-circle' : 'i-lucide-info'"
          class="size-5 shrink-0 mt-0.5"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium">
            {{ toast.title }}
          </p>
          <p v-if="toast.description" class="text-xs opacity-90 mt-0.5">
            {{ toast.description }}
          </p>
        </div>
        <button
          class="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
          @click="store.remove(toast.id)"
        >
          <span class="sr-only">Dismiss</span>
          &times;
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
