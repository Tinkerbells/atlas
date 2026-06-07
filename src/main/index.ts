import log from "electron-log";

import { IFSService } from "~/main/fs";
import { ILogger } from "~/common/logger";
import { IStorageService } from "~/main/storage";
import { ILifecycleManager } from "~/main/lifecycle";
import { RpcProtocolImpl } from "~/common/messaging/rpc-protocol";
import { mainRpcRegistry } from "~/main/messaging/electron-main-rpc";
import { LoggerRpcServer } from "~/main/messaging/services/logger-rpc-server";
import { SystemRpcServer } from "~/main/messaging/services/system-rpc-server";
import { getSingletonServiceDescriptors, InstantiationService, ServiceCollection } from "~/common/di";
import { BookmarksRpcServer, RecentFilesRpcServer, StorageRpcServer, ThemeRpcServer } from "~/main/messaging/services/storage-rpc-server";
import "~/main/logger/LoggerService";
import "~/main/fs/FSService";

const services = new ServiceCollection(...getSingletonServiceDescriptors());
const instantiationService = new InstantiationService(services);

instantiationService.invokeFunction((accessor) => {
  const storageService = accessor.get(IStorageService);
  const logger = accessor.get(ILogger);
  accessor.get(IFSService);

  mainRpcRegistry.onDidCreateConnection((connection) => {
    // Logger
    connection.multiplexer.open("logger").then((channel) => {
      const protocol = new RpcProtocolImpl(channel);
      protocol.setTarget(new LoggerRpcServer(logger));
    });

    // Storage
    connection.multiplexer.open("storage").then((channel) => {
      const protocol = new RpcProtocolImpl(channel);
      protocol.setTarget(new StorageRpcServer(storageService));
    });

    // Theme
    connection.multiplexer.open("theme").then((channel) => {
      const protocol = new RpcProtocolImpl(channel);
      protocol.setTarget(new ThemeRpcServer(storageService));
    });

    // Recent Files
    connection.multiplexer.open("recentFiles").then((channel) => {
      const protocol = new RpcProtocolImpl(channel);
      protocol.setTarget(new RecentFilesRpcServer(storageService));
    });

    // Bookmarks
    connection.multiplexer.open("bookmarks").then((channel) => {
      const protocol = new RpcProtocolImpl(channel);
      protocol.setTarget(new BookmarksRpcServer(storageService));
    });

    // System
    connection.multiplexer.open("system").then((channel) => {
      const protocol = new RpcProtocolImpl(channel);
      protocol.setTarget(new SystemRpcServer());
    });
  });

  const lifecycleManager = accessor.get<ILifecycleManager>(ILifecycleManager);
  log.info("[Main] Starting lifecycle manager...");
  lifecycleManager.start();
});
