<script setup lang="ts">
import { computed } from "vue";
import { icons } from "@lucide/vue";

const props = defineProps<{
  name?: string;
}>();

function toPascalCase(str: string): string {
  return str.replace(/(^|-)([a-z0-9])/g, (_, __, letter) => letter.toUpperCase());
}

const icon = computed(() => {
  if (!props.name)
    return null;

  const pascalName = toPascalCase(props.name);
  const component = (icons as Record<string, unknown>)[pascalName];

  return component || null;
});
</script>

<template>
  <component :is="icon" v-if="icon" />
</template>
