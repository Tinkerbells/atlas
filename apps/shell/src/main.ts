import { createApp } from "vue";
import "@fontsource-variable/google-sans";
import "@unocss/reset/tailwind.css";
import "uno.css";
import "~/services/logger";
import "~/services/commands";
import "~/services/context";
import "~/services/keybindings";
import "~/services/node-process";
import { createI18n } from "vue-i18n";
import { createRouter, createWebHistory } from "vue-router";
import {
  getSingletonServiceDescriptors,
  InstantiationService,
  ServiceCollection,
} from "@atlas/di";

import "./style.css";
import "~/shared/ui/styles/_tokens.scss";

import App from "./app.vue";
import { InstantiationServiceKey } from "./injection-keys";

const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en: {
      commandPalette: {
        placeholder: "Type a command or search...",
        back: "Back",
        close: "Close",
        emptySearch: "No results for \"{searchTerm}\"",
        empty: "No results found.",
      },
      sidebar: {
        close: "Close sidebar",
        toggle: "Toggle sidebar",
      },
      dashboardSidebar: {
        title: "Sidebar",
        description: "",
      },
      dashboardSidebarToggle: {
        open: "Open sidebar",
        close: "Close sidebar",
      },
      dashboardSidebarCollapse: {
        expand: "Expand sidebar",
        collapse: "Collapse sidebar",
      },
    },
  },
});

const descriptors = getSingletonServiceDescriptors();
const serviceCollection = new ServiceCollection(...descriptors);
const instantiationService = new InstantiationService(serviceCollection);

const router = createRouter({
  history: createWebHistory(),
  routes: [],
});

const app = createApp(App);
app.provide(InstantiationServiceKey, instantiationService);
app.use(router);
app.use(i18n);
app.mount("#app");
