<script setup lang="ts">
import { useAppTheme } from "~/renderer/composables/useAppTheme";

import Icon from "./ui/Icon.vue";
import Button from "./ui/Button.vue";

const { isDark, toggle } = useAppTheme();
</script>

<template>
  <Button
    color="neutral"
    variant="ghost"
    size="sm"
    :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
    @click="toggle"
  >
    <Icon
      v-if="isDark"
      name="i-lucide-moon"
      class="size-4"
    />
    <Icon
      v-else
      name="i-lucide-sun"
      class="size-4"
    />
  </Button>
</template>
