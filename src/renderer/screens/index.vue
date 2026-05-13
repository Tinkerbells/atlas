<script setup lang="ts">
import { Navigator } from "@renderer/navigator";
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <Navigator />
    </template>
  </UDashboardPanel>
</template>
