import { ref } from "vue";
import { defineStore } from "pinia";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  color?: "error" | "warning" | "info" | "success";
  duration?: number;
}

export const useToastStore = defineStore("toast", () => {
  const toasts = ref<Toast[]>([]);

  function add(toast: Omit<Toast, "id">): Toast {
    const id = Math.random().toString(36).substring(2, 9);
    const item: Toast = { id, duration: 5000, ...toast };
    toasts.value.push(item);
    setTimeout(() => remove(id), item.duration);
    return item;
  }

  function remove(id: string): void {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  }

  return {
    toasts,
    add,
    remove,
  };
});
