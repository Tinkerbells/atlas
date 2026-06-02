import log from "electron-log";

import { ILifecycleManager } from "~/main/lifecycle";
import { getSingletonServiceDescriptors, InstantiationService, ServiceCollection } from "~/common/di";
import "~/main/logger/LoggerService";
import "~/main/storage";

const services = new ServiceCollection(...getSingletonServiceDescriptors());
const instantiationService = new InstantiationService(services);

instantiationService.invokeFunction((accessor) => {
  const lifecycleManager = accessor.get<ILifecycleManager>(ILifecycleManager);
  log.info("[Main] Starting lifecycle manager...");
  lifecycleManager.start();
});
