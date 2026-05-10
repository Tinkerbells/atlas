import { app } from "electron";

import { SyncDescriptor } from "@/core/di/descriptors";
import { ILogger } from "@/platform/logger/common/logger";
import { FileLogger } from "@/platform/logger/main/file-logger";
import { ServiceCollection } from "@/core/di/service-collection";
import { InstantiationService } from "@/core/di/instantiation-service";
import { INodeProcess } from "@/platform/node-process/common/node-process";
import { IProductService } from "@/platform/product/common/product-service";
import { ILifecycleMainService } from "@/platform/lifecycle/common/lifecycle";
import { NodeProcessService } from "@/platform/node-process/main/node-process-service";
import { LifecycleMainService } from "@/platform/lifecycle/electron-main/lifecycle-main-service";
import { IEnvironmentMainService } from "@/platform/environment/electron-main/environment-main-service";

import type { AppInitConfig } from "./app-init-config";

import { Application } from "./app";

export async function initApp(initConfig: AppInitConfig) {
  // Disable hardware acceleration if needed (must be before app ready)
  app.disableHardwareAcceleration();

  // Enforce single instance (skip in dev to allow rapid restarts)
  const isDev = process.env.NODE_ENV === "development" || process.env.MODE === "development";
  if (!isDev) {
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      console.error("[main] Another instance is already running, exiting.");
      app.exit(0);
      return;
    }
  }

  await app.whenReady();

  const logsHome = app.getPath("logs");

  // Product service
  const productService: IProductService = {
    _serviceBrand: undefined,
    nameShort: "Atlas",
    nameLong: "Atlas File Manager",
    version: app.getVersion(),
  };

  // Environment service
  const environmentMainService: IEnvironmentMainService = {
    _serviceBrand: undefined,
    appRoot: app.getAppPath(),
    userDataPath: app.getPath("userData"),
    logsHome,
    app,
  };

  // Root DI container
  const services = new ServiceCollection();
  services.set(IProductService, productService);
  services.set(IEnvironmentMainService, environmentMainService);
  services.set(ILogger, new SyncDescriptor(FileLogger, [logsHome]));
  services.set(INodeProcess, new SyncDescriptor(NodeProcessService, [environmentMainService]));
  services.set(ILifecycleMainService, new SyncDescriptor(LifecycleMainService));

  const instantiationService = new InstantiationService(services, true);

  // Create and start application via DI
  const application = instantiationService.createInstance(Application, initConfig);
  await application.startup();
}
