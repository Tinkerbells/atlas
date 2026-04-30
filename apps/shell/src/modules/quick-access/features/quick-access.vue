<script setup lang="ts">
import type { CommandPaletteGroup } from "~/shared/ui/command-palette/command-pallete.vue";

import { useDebounceFn } from "@vueuse/core";
import { ILogger } from "~/services/logger/logger";
import { InstantiationServiceKey } from "~/injection-keys";
import { ScanCode } from "~/services/keybindings/scan-code";
import { INodeProcess } from "~/services/node-process/types";
import { CommandPalette } from "~/shared/ui/command-palette";
import { ICommandRegistry } from "~/services/commands/commands";
import { DisposableStore, OperatingSystem, OS } from "@atlas/shared";
import { inject, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { Keybinding, ScanCodeChord } from "~/services/keybindings/keybindings";
import { IFileSearchService } from "~/services/file-search/file-search-service";
import { IKeybindingService } from "~/services/keybindings/keybindings.service";

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
const keybindingService = instantiationService.invokeFunction(accessor =>
  accessor.get(IKeybindingService),
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

const open = ref(false);
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

const disposables = new DisposableStore();

onMounted(async () => {
  disposables.add(
    commandRegistry.registerCommand("quickAccess.open", () => {
      open.value = true;
    }),
  );

  const chord = new ScanCodeChord(
    OS !== OperatingSystem.Macintosh,
    false,
    false,
    OS === OperatingSystem.Macintosh,
    ScanCode.KeyK,
  );

  keybindingService.addDynamicKeybinding({
    keybinding: new Keybinding([chord]),
    command: "quickAccess.open",
    when: undefined,
    weight1: 0,
    weight2: 0,
  });

  const home = await nodeProcess.getHome();
  logger.info(`home resolved: ${home}`, { scope: "QuickAccess" });
  fileSearchProvider.setFolder(home);
  doSearch(searchTerm.value);
});

onUnmounted(() => {
  disposables.dispose();
});
</script>

<template>
  <CommandPalette
    v-if="open"
    v-model:search-term="searchTerm"
    :groups="groups"
    :loading="loading"
    close
    virtualize
    :placeholder="registry.resolve(searchTerm)?.descriptor.placeholder ?? 'Search...'"
    @update:open="open = $event"
    @select="open = false"
  />
</template>
