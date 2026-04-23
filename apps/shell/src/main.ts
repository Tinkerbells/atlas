import { createApp } from "vue";
import "uno.css";
import "~/services/logger";
import "~/services/commands";
import "~/services/context";
import "~/services/keybindings";
import "~/services/node-process";
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VCommandPalette } from "vuetify/labs/VCommandPalette";
import {
  getSingletonServiceDescriptors,
  InstantiationService,
  ServiceCollection,
} from "@atlas/di";

import "./style.css";
import App from "./app.vue";
import { InstantiationServiceKey } from "./injection-keys";

const vuetify = createVuetify({
  components: {
    ...components,
    VCommandPalette,
  },
  directives,
});

const descriptors = getSingletonServiceDescriptors();
const serviceCollection = new ServiceCollection(...descriptors);
const instantiationService = new InstantiationService(serviceCollection);

const app = createApp(App);
app.provide(InstantiationServiceKey, instantiationService);
app.use(vuetify);
app.mount("#app");
