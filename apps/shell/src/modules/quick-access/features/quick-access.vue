<script setup lang="ts">
import type { CommandPaletteGroup } from "~/shared/ui/command-palette/command-pallete.vue";

import { useDebounceFn } from "@vueuse/core";
import { ILogger } from "~/services/logger/logger";
import { InstantiationServiceKey } from "~/injection-keys";
import { CommandPalette } from "~/shared/ui/command-palette";
import { INodeProcess } from "~/services/node-process/types";
import { inject, onMounted, ref, shallowRef, watch } from "vue";
import { ICommandRegistry } from "~/services/commands/commands";
import { IFileSearchService } from "~/services/file-search/file-search-service";

import { CommandProvider } from "../domain/command-provider";
import { FileSearchProvider } from "../domain/file-search-provider";
import { QuickAccessRegistry } from "../domain/quick-access-registry";

const instantiationService = inject(InstantiationServiceKey);

if (!instantiationService) {
  throw new Error("InstantiationService not provided");
}

const commandRegistry = instantiationService.invokeFunction(accessor =>
  accessor.get(ICommandRegistry),
);
const fileSearchService = instantiationService.invokeFunction(accessor =>
  accessor.get(IFileSearchService),
);
const nodeProcess = instantiationService.invokeFunction(accessor =>
  accessor.get(INodeProcess),
);
const logger = instantiationService.invokeFunction(accessor =>
  accessor.get(ILogger),
);

const registry = new QuickAccessRegistry();

registry.registerProvider({
  prefix: ">",
  provider: new CommandProvider(commandRegistry),
  placeholder: "Type a command...",
});

const fileSearchProvider = new FileSearchProvider(fileSearchService, "", logger);
registry.registerProvider({
  prefix: "",
  provider: fileSearchProvider,
  placeholder: "Search files by name...",
});

const searchTerm = ref("");
const loading = ref(false);
const groups = shallowRef<CommandPaletteGroup[]>([]);
let abortController = new AbortController();

async function doSearch(term: string) {
  abortController.abort();
  abortController = new AbortController();

  const resolved = registry.resolve(term);
  logger.info(`doSearch: term="${term}", resolved=${resolved ? `prefix="${resolved.descriptor.prefix}", filter="${resolved.filter}"` : "null"}`, { scope: "QuickAccess" });

  if (!resolved) {
    groups.value = [];
    return;
  }

  const { descriptor, filter } = resolved;

  loading.value = true;

  try {
    const result = await descriptor.provider.getPicks(filter, abortController.signal);
    if (!abortController.signal.aborted) {
      logger.info(`doSearch: got ${result.length} groups, total items: ${result.reduce((sum, g) => sum + (g.items?.length ?? 0), 0)}`, { scope: "QuickAccess" });
      groups.value = result;
    }
  }
  catch (err) {
    if (!abortController.signal.aborted) {
      logger.error(`doSearch: error: ${err}`, { scope: "QuickAccess" });
    }
  }
  finally {
    if (!abortController.signal.aborted) {
      loading.value = false;
    }
  }
}

watch(searchTerm, useDebounceFn(doSearch, 150));

onMounted(async () => {
  const home = await nodeProcess.getHome();
  logger.info(`home resolved: ${home}`, { scope: "QuickAccess" });
  fileSearchProvider.setFolder(home);
  doSearch(searchTerm.value);
});
</script>

<template>
  <CommandPalette
    v-model:search-term="searchTerm" :groups="groups" :loading="loading" close virtualize
    :placeholder="registry.resolve(searchTerm)?.descriptor.placeholder ?? 'Search...'"
  />
</template>
