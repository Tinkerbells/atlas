<script setup lang="ts">
import { ref } from "vue";

import { App } from "@/ui/shared/ui/app";
import { useClipboard } from "@/ui/composables/use-clipboard";

const clipboard = useClipboard();
const inputText = ref("");
const pastedText = ref("");

async function copy() {
  await clipboard.writeText(inputText.value);
}

async function paste() {
  pastedText.value = await clipboard.readText();
}
</script>

<template>
  <App>
    <div class="flex flex-col gap-4 p-4">
      <div>hello</div>

      <div class="flex gap-2">
        <input v-model="inputText" class="border rounded px-2 py-1" placeholder="Type something...">
        <button class="border rounded px-3 py-1" @click="copy">
          Copy
        </button>
        <button class="border rounded px-3 py-1" @click="paste">
          Paste
        </button>
      </div>

      <p v-if="pastedText">
        From clipboard: {{ pastedText }}
      </p>
    </div>
  </App>
</template>
