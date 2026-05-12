import type { SearchOptions, SearchResult } from "@platform/common/file-search";

import { ref, shallowRef } from "vue";
import { IFileSearchService } from "@platform/common/file-search";

import { useService } from "./use-service";

export function useFileSearch() {
  const fileSearchService = useService(IFileSearchService);

  const query = ref("");
  const results = shallowRef<SearchResult[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function search(q: string, options?: SearchOptions) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    query.value = q;

    if (!q.trim()) {
      results.value = [];
      isLoading.value = false;
      return;
    }

    isLoading.value = true;
    error.value = null;

    debounceTimer = setTimeout(async () => {
      try {
        const r = await fileSearchService.search(q, options);
        results.value = r;
      }
      catch (err) {
        error.value = err instanceof Error ? err : new Error(String(err));
      }
      finally {
        isLoading.value = false;
      }
    }, 200);
  }

  function clear() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    query.value = "";
    results.value = [];
    isLoading.value = false;
    error.value = null;
  }

  return {
    query,
    results,
    isLoading,
    error,
    search,
    clear,
  };
}
