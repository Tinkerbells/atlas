import type { ServicesAccessor } from "@core/di";

import "@fontsource-variable/google-sans";

import "./style.css";
import { createApp } from "vue";
import ui from "@nuxt/ui/vue-plugin";
import { createI18n } from "vue-i18n";
import { ProxyChannel } from "@core/ipc/proxy-channel";
import { INavigatorService } from "@renderer/navigator";
import { ILogger } from "@platform/logger/common/logger";
import { IFileIndexService } from "@platform/common/file-index";
import { IFileSearchService } from "@platform/common/file-search";
import { IClipboardService } from "@platform/clipboard/common/clipboard";
import { NavigatorService } from "@renderer/navigator/navigator-service";
import { ServiceAccessorSymbol } from "@renderer/composables/use-service";
import { INodeProcess } from "@platform/node-process/common/node-process";
import { IConfigurationService } from "@platform/configuration/common/configuration-service";
import {
  getSingletonServiceDescriptors,
  InstantiationService,
  ServiceCollection,

} from "@core/di";
// Side-effect registration of renderer-only services
import "@platform/commands/renderer";
import "@platform/context/renderer";
import "@platform/keybindings/renderer";

import "./shared/ui/styles/_tokens.scss";
import { SharedProcessService } from "@renderer/services/shared-process/electron-browser/shared-process-service";
import { ElectronIPCMainProcessService } from "@renderer/services/main-process/electron-browser/main-process-service";

import App from "./app.vue";
import router from "./router";
import { InstantiationServiceKey } from "./injection-keys";

async function bootstrap() {
  const i18n = createI18n({
    legacy: false,
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
  services.set(IConfigurationService, ProxyChannel.toService<IConfigurationService>(mainProcessService.getChannel("configuration")));

  // Shared process services via relay through main process
  console.log("[renderer] Creating SharedProcessService...");
  const sharedProcessService = new SharedProcessService();
  console.log("[renderer] SharedProcessService created");
  const fileIndexChannel = await sharedProcessService.getChannel("fileIndex");
  console.log("[renderer] Got fileIndex channel");
  const fileSearchChannel = await sharedProcessService.getChannel("fileSearch");
  console.log("[renderer] Got fileSearch channel");
  services.set(IFileIndexService, ProxyChannel.toService<IFileIndexService>(fileIndexChannel));
  services.set(IFileSearchService, ProxyChannel.toService<IFileSearchService>(fileSearchChannel));

  // Navigator service
  services.set(INavigatorService, new NavigatorService());

  // Renderer-only singletons
  const descriptors = getSingletonServiceDescriptors();
  for (const [id, descriptor] of descriptors) {
    services.set(id, descriptor);
  }

  const instantiationService = new InstantiationService(services);

  const accessor: ServicesAccessor = {
    get: id => instantiationService.invokeFunction(a => a.get(id)),
  };

  const app = createApp(App);
  app.provide(ServiceAccessorSymbol, accessor);
  app.provide(InstantiationServiceKey, instantiationService);
  app.use(i18n);
  app.use(ui);
  app.use(router);
  app.mount("#app");
}

bootstrap().catch(console.error);
