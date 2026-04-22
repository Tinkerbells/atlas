import { createApp } from "vue";
import Varlet from "@varlet/ui";
import "uno.css";
import "~/services/logger";
import "~/services/commands";
import "~/services/context";
import "~/services/keybindings";
import {
  getSingletonServiceDescriptors,
  InstantiationService,
  ServiceCollection,
} from "@atlas/di";

import "./style.css";
import App from "./app.vue";
import { InstantiationServiceKey } from "./injection-keys";

const descriptors = getSingletonServiceDescriptors();
const serviceCollection = new ServiceCollection(...descriptors);
const instantiationService = new InstantiationService(serviceCollection);

const app = createApp(App);
app.use(Varlet);
app.provide(InstantiationServiceKey, instantiationService);
app.mount("#app");
