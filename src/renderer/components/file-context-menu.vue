<script setup lang="ts">
import type { ContextMenuItem } from "@nuxt/ui";
import type { URI } from "@platform/common/uri/uri";
import type { IFileStat } from "@platform/files/common/files";

import { computed, ref } from "vue";
import { VSBuffer } from "@core/base/buffer";
import { URI as UriClass } from "@platform/common/uri/uri";
import { IFileService } from "@platform/files/common/files";
import { useService } from "@renderer/composables/use-service";
import { dirname, isEqual, joinPath } from "@core/base/resources";
import { INavigatorService, PaneType } from "@renderer/navigator";
import { useFileClipboard } from "@renderer/composables/use-file-clipboard";

const props = defineProps<{
  resource?: URI;
  entry?: IFileStat;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const fileService = useService(IFileService);
const navigatorService = useService(INavigatorService);
const fileClipboard = useFileClipboard();

const renameOpen = ref(false);
const renameValue = ref("");
const renameTarget = ref<URI | null>(null);

const createOpen = ref(false);
const createValue = ref("");
const createType = ref<"file" | "folder">("file");

function openEntry(entry: IFileStat): void {
  const uri = UriClass.revive(entry.resource);
  if (entry.isDirectory) {
    navigatorService.navigateActivePane(uri);
  }
  else {
    navigatorService.openPane(uri, { type: PaneType.Preview, title: entry.name });
  }
}

function openEntryInNewPane(entry: IFileStat): void {
  const uri = UriClass.revive(entry.resource);
  if (entry.isDirectory) {
    navigatorService.openPane(uri, { type: PaneType.Explorer, title: entry.name });
  }
  else {
    navigatorService.openPane(uri, { type: PaneType.Preview, title: entry.name });
  }
}

async function deleteEntry(entry: IFileStat): Promise<void> {
  const uri = UriClass.revive(entry.resource);
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm(`Are you sure you want to delete "${entry.name}"?`);
  if (!confirmed)
    return;
  try {
    await fileService.del(uri, { recursive: entry.isDirectory, useTrash: true, atomic: false });
    emit("refresh");
  }
  catch (err) {
    console.error("[FileContextMenu] delete failed:", err);
    // eslint-disable-next-line no-alert
    window.alert(`Failed to delete "${entry.name}"`);
  }
}

function startRename(entry: IFileStat): void {
  renameTarget.value = UriClass.revive(entry.resource);
  renameValue.value = entry.name;
  renameOpen.value = true;
}

async function confirmRename(): Promise<void> {
  if (!renameTarget.value || !renameValue.value.trim()) {
    renameOpen.value = false;
    return;
  }
  const parent = dirname(renameTarget.value);
  const newResource = joinPath(parent, renameValue.value.trim());
  if (!isEqual(newResource, renameTarget.value)) {
    try {
      await fileService.move(renameTarget.value, newResource, true);
      emit("refresh");
    }
    catch (err) {
      console.error("[FileContextMenu] rename failed:", err);
      // eslint-disable-next-line no-alert
      window.alert(`Failed to rename`);
    }
  }
  renameOpen.value = false;
}

function startCreate(type: "file" | "folder"): void {
  createType.value = type;
  createValue.value = "";
  createOpen.value = true;
}

async function confirmCreate(): Promise<void> {
  const name = createValue.value.trim();
  if (!name || !props.resource) {
    createOpen.value = false;
    return;
  }
  const target = joinPath(props.resource, name);
  try {
    if (createType.value === "folder") {
      await fileService.createFolder(target);
    }
    else {
      await fileService.createFile(target, VSBuffer.fromString(""));
    }
    emit("refresh");
  }
  catch (err) {
    console.error("[FileContextMenu] create failed:", err);
    // eslint-disable-next-line no-alert
    window.alert(`Failed to create ${createType.value}`);
  }
  createOpen.value = false;
}

async function pasteInto(targetResource: URI): Promise<void> {
  if (!fileClipboard.canPaste())
    return;
  const { entries, action } = fileClipboard.clipboard.value!;
  try {
    for (const item of entries) {
      const dest = joinPath(targetResource, item.name);
      if (action === "copy") {
        await fileService.copy(item.resource, dest, true);
      }
      else {
        await fileService.move(item.resource, dest, true);
      }
    }
    if (action === "cut") {
      fileClipboard.clear();
    }
    emit("refresh");
  }
  catch (err) {
    console.error("[FileContextMenu] paste failed:", err);
    // eslint-disable-next-line no-alert
    window.alert("Failed to paste");
  }
}

function copyEntry(entry: IFileStat): void {
  fileClipboard.copy([{ resource: UriClass.revive(entry.resource), name: entry.name, isDirectory: entry.isDirectory }]);
}

function cutEntry(entry: IFileStat): void {
  fileClipboard.cut([{ resource: UriClass.revive(entry.resource), name: entry.name, isDirectory: entry.isDirectory }]);
}

const items = computed<ContextMenuItem[][]>(() => {
  if (props.entry) {
    const openItems: ContextMenuItem[] = [
      {
        label: "Open",
        icon: "i-lucide-eye",
        onSelect: () => openEntry(props.entry!),
      },
      {
        label: "Open in New Pane",
        icon: "i-lucide-square-plus",
        onSelect: () => openEntryInNewPane(props.entry!),
      },
    ];

    const actionItems: ContextMenuItem[] = [
      {
        label: "Cut",
        icon: "i-lucide-scissors",
        kbds: ["meta", "x"],
        onSelect: () => cutEntry(props.entry!),
      },
      {
        label: "Copy",
        icon: "i-lucide-copy",
        kbds: ["meta", "c"],
        onSelect: () => copyEntry(props.entry!),
      },
    ];

    if (props.entry.isDirectory && fileClipboard.canPaste()) {
      actionItems.push({
        label: "Paste Into",
        icon: "i-lucide-clipboard-paste",
        kbds: ["meta", "v"],
        onSelect: () => pasteInto(UriClass.revive(props.entry!.resource)),
      });
    }

    const manageItems: ContextMenuItem[] = [
      {
        label: "Rename",
        icon: "i-lucide-pencil",
        onSelect: () => startRename(props.entry!),
      },
      {
        type: "separator" as const,
      },
      {
        label: "Delete",
        color: "error" as const,
        icon: "i-lucide-trash",
        onSelect: () => deleteEntry(props.entry!),
      },
    ];

    return [openItems, actionItems, manageItems];
  }

  // Background context menu
  const bgItems: ContextMenuItem[] = [
    {
      label: "New Folder",
      icon: "i-lucide-folder-plus",
      onSelect: () => startCreate("folder"),
    },
    {
      label: "New File",
      icon: "i-lucide-file-plus",
      onSelect: () => startCreate("file"),
    },
  ];

  if (fileClipboard.canPaste()) {
    bgItems.push(
      { type: "separator" as const },
      {
        label: "Paste",
        icon: "i-lucide-clipboard-paste",
        kbds: ["meta", "v"],
        onSelect: () => pasteInto(props.resource!),
      },
    );
  }

  return [bgItems];
});
</script>

<template>
  <UContextMenu :items="items" :disabled="!props.resource">
    <slot />

    <UModal :open="renameOpen" @update:open="renameOpen = $event">
      <template #content>
        <div class="flex flex-col gap-4 p-4 w-80">
          <h3 class="text-base font-semibold">
            Rename
          </h3>
          <UInput v-model="renameValue" placeholder="Enter new name..." />
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" size="sm" @click="renameOpen = false">
              Cancel
            </UButton>
            <UButton color="primary" size="sm" @click="confirmRename">
              Rename
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal :open="createOpen" @update:open="createOpen = $event">
      <template #content>
        <div class="flex flex-col gap-4 p-4 w-80">
          <h3 class="text-base font-semibold">
            {{ createType === "folder" ? "New Folder" : "New File" }}
          </h3>
          <UInput v-model="createValue" placeholder="Enter name..." @keydown.enter="confirmCreate" />
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" size="sm" @click="createOpen = false">
              Cancel
            </UButton>
            <UButton color="primary" size="sm" @click="confirmCreate">
              Create
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContextMenu>
</template>
