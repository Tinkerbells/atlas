import { createApp } from "vue";
import Varlet from "@varlet/ui";
import "uno.css";
import { IContextKeyService } from "~/services/context";
import { ConsoleLogger, ILogger } from "~/services/logger";
import { ContextKeyService } from "~/services/context/context-key-service";
import {
  CommandRegistry,
  CommandService,
  ICommandRegistry,
  ICommandService,
} from "~/services/commands";
import {
  getSingletonServiceDescriptors,
  InstantiationService,
  registerSingleton,
  ServiceCollection,
} from "@atlas/di";
import {
  BrowserKeyboardLayoutService,
  IKeybindingService,
  IKeybindingsRegistry,
  IKeyboardLayoutService,
  IKeypressEventBus,
  KeybindingService,
  KeybindingsRegistryImpl,
  KeypressEventBus,
} from "~/services/keybindings";

import "./style.css";
import App from "./app.vue";
import { InstantiationServiceKey } from "./injection-keys";

registerSingleton(ILogger, ConsoleLogger, 1);
registerSingleton(ICommandRegistry, CommandRegistry, 0);
registerSingleton(ICommandService, CommandService, 0);
registerSingleton(IContextKeyService, ContextKeyService, 0);
registerSingleton(IKeypressEventBus, KeypressEventBus, 0);
registerSingleton(IKeybindingsRegistry, KeybindingsRegistryImpl, 0);
registerSingleton(IKeyboardLayoutService, BrowserKeyboardLayoutService, 1);
registerSingleton(IKeybindingService, KeybindingService, 1);

const descriptors = getSingletonServiceDescriptors();
const serviceCollection = new ServiceCollection(...descriptors);
const instantiationService = new InstantiationService(serviceCollection);

const app = createApp(App);
app.use(Varlet);
app.provide(InstantiationServiceKey, instantiationService);
app.mount("#app");
