<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { ref } from "vue";

const open = ref(false);

const links = [[{
  label: "Home",
  icon: "i-lucide-house",
  to: "/",
  onSelect: () => {
    open.value = false;
  },
}, {
  label: "Settings",
  to: "/settings",
  icon: "i-lucide-settings",
  onSelect: () => {
    open.value = false;
  },
}], [{
  label: "Feedback",
  icon: "i-lucide-message-circle",
  to: "https://github.com/nuxt-ui-templates/dashboard-vue",
  target: "_blank",
}, {
  label: "Help & Support",
  icon: "i-lucide-info",
  to: "https://github.com/nuxt/ui",
  target: "_blank",
}]] satisfies NavigationMenuItem[][];
</script>

<template>
  <UDashboardGroup unit="rem" storage="local">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-2">
          <UIcon name="i-lucide-folder-open" class="size-5 text-primary" />
          <span v-if="!collapsed" class="font-semibold text-sm">Atlas</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex items-center gap-2 px-2">
          <UAvatar
            src="https://github.com/nuxt.png"
            alt="User"
            size="sm"
          />
          <span v-if="!collapsed" class="text-sm">User</span>
        </div>
      </template>
    </UDashboardSidebar>

    <RouterView />
  </UDashboardGroup>
</template>
