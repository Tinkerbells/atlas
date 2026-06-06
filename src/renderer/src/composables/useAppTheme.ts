import { computed, onMounted, watch } from "vue";
import { useColorMode } from "@vueuse/core";
import { themeService } from "~/renderer/services/theme-service";

export function useAppTheme() {
  const colorMode = useColorMode({
    attribute: "class",
    selector: "html",
    initialValue: "dark",
  });

  onMounted(async () => {
    try {
      const saved = await themeService.get();
      if (saved && (saved === "dark" || saved === "light")) {
        colorMode.value = saved;
      }
    }
    catch {
      // ignore
    }
  });

  watch(
    () => colorMode.value,
    (value) => {
      themeService.set(value);
    },
  );

  const isDark = computed(() => colorMode.value === "dark");

  function toggle() {
    colorMode.value = isDark.value ? "light" : "dark";
  }

  return {
    colorMode,
    isDark,
    toggle,
  };
}
