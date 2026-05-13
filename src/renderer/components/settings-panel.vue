<script setup lang="ts">
import { ref, watch } from "vue";
import { useService } from "@renderer/composables/use-service";
import { IConfigurationService } from "@platform/configuration/common/configuration-service";

const open = ref(false);
const configService = useService(IConfigurationService);

const patterns = ref<{ pattern: string; enabled: boolean }[]>([]);
const newPattern = ref("");
const saving = ref(false);

async function load() {
  const value = await configService.getValue<Record<string, boolean>>("files.exclude");
  const raw = value ?? {};
  patterns.value = Object.entries(raw).map(([pattern, enabled]) => ({ pattern, enabled }));
}

watch(open, (isOpen) => {
  if (isOpen) {
    load();
  }
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
    open.value = false;
  }
  catch (err) {
    console.error("[SettingsPanel] failed to save files.exclude:", err);
  }
  finally {
    saving.value = false;
  }
}

function show() {
  open.value = true;
}

function onOpenChange(value: boolean) {
  open.value = value;
}

defineExpose({ show });
</script>

<template>
  <UModal :open="open" @update:open="onOpenChange">
    <template #content>
      <div class="flex flex-col gap-4 p-4 w-96">
        <h2 class="text-lg font-semibold">
          Settings
        </h2>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Files: Exclude</label>
          <div class="flex flex-col gap-1 max-h-60 overflow-auto">
            <div
              v-for="(item, index) in patterns"
              :key="item.pattern"
              class="flex items-center gap-2"
            >
              <input
                v-model="item.enabled"
                type="checkbox"
                class="w-4 h-4"
              >
              <span class="text-sm flex-1 truncate">{{ item.pattern }}</span>
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

          <div class="flex gap-2 mt-1">
            <input
              v-model="newPattern"
              placeholder="Add pattern (e.g. **/dist)"
              class="flex-1 text-sm px-2 py-1 border rounded"
              @keydown.enter="addPattern"
            >
            <UButton
              color="neutral"
              size="sm"
              @click="addPattern"
            >
              Add
            </UButton>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-2">
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            @click="open = false"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            size="sm"
            :loading="saving"
            @click="save"
          >
            Save
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
