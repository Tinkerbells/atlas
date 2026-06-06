import log from "electron-log";

import { ILifecycleManager } from "~/main/lifecycle";
import { IStorageService } from "~/main/storage";
import { getSingletonServiceDescriptors, InstantiationService, ServiceCollection } from "~/common/di";
import "~/main/logger/LoggerService";
import "~/main/storage";

const services = new ServiceCollection(...getSingletonServiceDescriptors());
const instantiationService = new InstantiationService(services);

instantiationService.invokeFunction((accessor) => {
  accessor.get(IStorageService);
  const lifecycleManager = accessor.get<ILifecycleManager>(ILifecycleManager);
  log.info("[Main] Starting lifecycle manager...");
  lifecycleManager.start();
});
