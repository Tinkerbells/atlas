import { ref, watchEffect } from "vue";

type ColorMode = "light" | "dark" | "system";

const storageKey = "atlas-color-mode";

function getSystemPreference(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredMode(): ColorMode | null {
  try {
    return localStorage.getItem(storageKey) as ColorMode | null;
  }
  catch {
    return null;
  }
}

function storeMode(mode: ColorMode): void {
  try {
    localStorage.setItem(storageKey, mode);
  }
  catch {
    // ignore
  }
}

function applyMode(mode: ColorMode): void {
  const root = document.documentElement;
  const effective = mode === "system" ? getSystemPreference() : mode;

  if (effective === "dark") {
    root.classList.add("dark");
  }
  else {
    root.classList.remove("dark");
  }
}

const initialMode = getStoredMode() ?? "system";
applyMode(initialMode);

const mode = ref<ColorMode>(initialMode);

export function useColorMode() {
  watchEffect(() => {
    applyMode(mode.value);
    storeMode(mode.value);
  });

  function toggle() {
    mode.value = mode.value === "dark" ? "light" : "dark";
  }

  return {
    mode,
    toggle,
  };
}
