<script setup lang="ts">
import { computed } from "vue";
import {
  AlertCircle,
  ArrowUp,
  Copy,
  File,
  FileCode,
  FileText,
  Folder,
  FolderOpen,
  Image,
  Info,
  Loader,
  Moon,
  Music,
  Pencil,
  Scissors,
  Sun,
  Trash,
  Video,
} from "@lucide/vue";

const props = defineProps<{
  name: string;
}>();

const iconMap: Record<string, typeof ArrowUp | undefined> = {
  "i-lucide-arrow-up": ArrowUp,
  "i-lucide-loader": Loader,
  "i-lucide-alert-circle": AlertCircle,
  "i-lucide-folder": Folder,
  "i-lucide-folder-open": FolderOpen,
  "i-lucide-file": File,
  "i-lucide-file-text": FileText,
  "i-lucide-image": Image,
  "i-lucide-video": Video,
  "i-lucide-music": Music,
  "i-lucide-file-code": FileCode,
  "i-lucide-pencil": Pencil,
  "i-lucide-copy": Copy,
  "i-lucide-scissors": Scissors,
  "i-lucide-trash": Trash,
  "i-lucide-info": Info,
  "i-lucide-sun": Sun,
  "i-lucide-moon": Moon,
};

const IconComponent = computed(() => iconMap[props.name]);
</script>

<template>
  <IconComponent v-if="IconComponent" class="shrink-0" v-bind="$attrs" />
  <span v-else class="shrink-0 inline-block size-4 bg-gray-300 rounded" />
</template>
