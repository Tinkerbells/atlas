import { createApp } from "vue";
import "@fontsource-variable/google-sans";
import "uno.css";
import "~/services/logger";
import "~/services/commands";
import "~/services/context";
import "~/services/keybindings";
import "~/services/node-process";
import { createI18n } from "vue-i18n";
import {
  getSingletonServiceDescriptors,
  InstantiationService,
  ServiceCollection,
} from "@atlas/di";

import "./style.css";
import App from "./app.vue";
import { InstantiationServiceKey } from "./injection-keys";

const i18n = createI18n({});

const descriptors = getSingletonServiceDescriptors();
const serviceCollection = new ServiceCollection(...descriptors);
const instantiationService = new InstantiationService(serviceCollection);

const app = createApp(App);
app.provide(InstantiationServiceKey, instantiationService);
app.use(i18n);
app.mount("#app");
