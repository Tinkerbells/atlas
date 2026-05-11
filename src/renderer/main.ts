import type { ServicesAccessor } from "@core/di";

import "@fontsource-variable/google-sans";
import "@unocss/reset/tailwind.css";
import "uno.css";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import { ProxyChannel } from "@core/ipc/proxy-channel";
import { ILogger } from "@platform/logger/common/logger";
import { createRouter, createWebHistory } from "vue-router";
import { IClipboardService } from "@platform/clipboard/common/clipboard";
import { ServiceAccessorSymbol } from "@renderer/composables/use-service";
import { INodeProcess } from "@platform/node-process/common/node-process";
import {
  getSingletonServiceDescriptors,
  InstantiationService,
  ServiceCollection,

} from "@core/di";
import { ElectronIPCMainProcessService } from "@renderer/services/main-process/electron-browser/main-process-service";
// Side-effect registration of renderer-only services
import "@platform/commands/renderer";
import "@platform/context/renderer";
import "@platform/keybindings/renderer";

import "./style.css";
import "./shared/ui/styles/_tokens.scss";
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

const mainProcessService = new ElectronIPCMainProcessService();

const services = new ServiceCollection();

// IPC proxies for main-side services
services.set(ILogger, ProxyChannel.toService<ILogger>(mainProcessService.getChannel("logger")));
services.set(INodeProcess, ProxyChannel.toService<INodeProcess>(mainProcessService.getChannel("nodeProcess")));
services.set(IClipboardService, ProxyChannel.toService<IClipboardService>(mainProcessService.getChannel("clipboard")));

// Renderer-only singletons
const descriptors = getSingletonServiceDescriptors();
for (const [id, descriptor] of descriptors) {
  services.set(id, descriptor);
}

const instantiationService = new InstantiationService(services);

const accessor: ServicesAccessor = {
  get: id => instantiationService.invokeFunction(a => a.get(id)),
};

const router = createRouter({
  history: createWebHistory(),
  routes: [],
});

const app = createApp(App);
app.provide(ServiceAccessorSymbol, accessor);
app.provide(InstantiationServiceKey, instantiationService);
app.use(router);
app.use(i18n);
app.mount("#app");
