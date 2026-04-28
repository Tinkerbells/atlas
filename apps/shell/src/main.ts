import { createApp } from "vue";
import ui from "@nuxt/ui/vue-plugin";
import "@fontsource-variable/google-sans";
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

import "./assets/css/main.css";
import "./style.css";
import App from "./app.vue";
import { InstantiationServiceKey } from "./injection-keys";

const i18n = createI18n({});

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
app.use(ui);
app.mount("#app");
