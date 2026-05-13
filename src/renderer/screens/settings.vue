<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IndexerPanel } from "@renderer/modules/indexer";
import { useService } from "@renderer/composables/use-service";
import { IConfigurationService } from "@platform/configuration/common/configuration-service";

const configService = useService(IConfigurationService);

const patterns = ref<{ pattern: string; enabled: boolean }[]>([]);
const newPattern = ref("");
const saving = ref(false);

async function load() {
  const value = await configService.getValue<Record<string, boolean>>("files.exclude");
  const raw = value ?? {};
  patterns.value = Object.entries(raw).map(([pattern, enabled]) => ({ pattern, enabled }));
}

onMounted(() => {
  load();
});

function removePattern(index: number) {
  patterns.value.splice(index, 1);
}

function addPattern() {
  const p = newPattern.value.trim();
  if (p && !patterns.value.some(x => x.pattern === p)) {
    patterns.value.push({ pattern: p, enabled: true });
    newPattern.value = "";
  }
}

async function save() {
  saving.value = true;
  const value: Record<string, boolean> = {};
  for (const { pattern, enabled } of patterns.value) {
    value[pattern] = enabled;
  }
  try {
    await configService.updateValue("files.exclude", value);
  }
  catch (err) {
    console.error("[SettingsScreen] failed to save files.exclude:", err);
  }
  finally {
    saving.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-6 max-w-2xl mx-auto w-full py-6">
        <div>
          <h1 class="text-2xl font-semibold mb-1">
            Settings
          </h1>
          <p class="text-muted text-sm">
            Manage your Atlas preferences
          </p>
        </div>

        <div class="flex flex-col gap-4">
          <h2 class="text-lg font-medium">
            File Index
          </h2>
          <p class="text-sm text-muted">
            Manage the file search index and scan status
          </p>
          <div class="border rounded-lg p-4">
            <IndexerPanel />
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <h2 class="text-lg font-medium">
            Files: Exclude
          </h2>
          <p class="text-sm text-muted">
            Patterns for files and folders to exclude from the file index
          </p>

          <div class="flex flex-col gap-2 border rounded-lg p-4">
            <div class="flex flex-col gap-2 max-h-80 overflow-auto">
              <div
                v-for="(item, index) in patterns"
                :key="item.pattern"
                class="flex items-center gap-3 py-2 border-b last:border-b-0"
              >
                <UCheckbox v-model="item.enabled" />
                <span class="text-sm flex-1 truncate font-mono">{{ item.pattern }}</span>
                <UButton
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click="removePattern(index)"
                >
                  Remove
                </UButton>
              </div>
            </div>

            <div class="flex gap-2 mt-2">
              <UInput
                v-model="newPattern"
                placeholder="Add pattern (e.g. **/dist)"
                class="flex-1"
                @keydown.enter="addPattern"
              />
              <UButton
                color="neutral"
                size="sm"
                @click="addPattern"
              >
                Add
              </UButton>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <UButton
            color="primary"
            size="sm"
            :loading="saving"
            @click="save"
          >
            Save Changes
          </UButton>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
