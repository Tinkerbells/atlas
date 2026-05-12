<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useFileSearch } from "@renderer/composables/use-file-search";

const open = ref(false);
const { query, results, isLoading, search, clear } = useFileSearch();

const groups = computed(() => [
  {
    id: "files",
    label: query.value ? `Results for "${query.value}"` : "Recent files",
    items: results.value.map(r => ({
      label: r.name,
      suffix: r.path,
      icon: r.isDirectory ? "i-lucide-folder" : "i-lucide-file",
      onSelect: () => {
        // TODO: open file / navigate to directory

        console.log("[QuickFileAccess] selected:", r.uri);
        open.value = false;
        clear();
      },
    })),
    ignoreFilter: true,
  },
]);

function onSearchTermChange(term: string) {
  search(term, { limit: 50 });
}

function onOpenChange(value: boolean) {
  open.value = value;
  if (!value) {
    clear();
  }
  else {
    // Focus on open; search is empty initially
    search("", { limit: 20 });
  }
}

// Expose open method for command registry
function show() {
  open.value = true;
}

// Watch our own query to keep palette in sync (for external clear)
watch(query, (q) => {
  if (!q && open.value) {
    search("", { limit: 20 });
  }
});

defineExpose({ show, open });
</script>

<template>
  <UModal :open="open" @update:open="onOpenChange">
    <template #content>
      <UCommandPalette
        v-model:search-term="query"
        :loading="isLoading"
        :groups="groups"
        placeholder="Search files by name..."
        class="h-96 w-full"
        @update:search-term="onSearchTermChange"
      />
    </template>
  </UModal>
</template>
