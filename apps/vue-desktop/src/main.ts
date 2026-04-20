import { createApp } from 'vue';
import App from './App.vue';
import {
  InstantiationService,
  ServiceCollection,
  registerSingleton,
  getSingletonServiceDescriptors,
} from '@atlas/di';

import { ILogger, ConsoleLogger } from '@/services/logger';
import {
  ICommandRegistry,
  CommandRegistry,
  ICommandService,
  CommandService,
} from '@/services/commands';
import { IContextKeyService } from '@/services/context';
import { ContextKeyService } from '@/services/context/context-key.service';
import {
  IKeybindingsRegistry,
  KeybindingsRegistryImpl,
  IKeyboardLayoutService,
  BrowserKeyboardLayoutService,
  IKeybindingService,
  KeybindingService,
} from '@/services/keybindings';
import { InstantiationServiceKey } from './injection-keys';

registerSingleton(ILogger, ConsoleLogger as any, 1);
registerSingleton(ICommandRegistry, CommandRegistry as any, 0);
registerSingleton(ICommandService, CommandService as any, 0);
registerSingleton(IContextKeyService, ContextKeyService as any, 0);
registerSingleton(IKeybindingsRegistry, KeybindingsRegistryImpl as any, 0);
registerSingleton(IKeyboardLayoutService, BrowserKeyboardLayoutService as any, 1);
registerSingleton(IKeybindingService, KeybindingService as any, 1);

const descriptors = getSingletonServiceDescriptors();
const serviceCollection = new ServiceCollection(...descriptors);
const instantiationService = new InstantiationService(serviceCollection);

const app = createApp(App);
app.provide(InstantiationServiceKey, instantiationService);
app.mount('#app');
