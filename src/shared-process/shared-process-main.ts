/* ---------------------------------------------------------------------------------------------
 *  Shared process entry point — VS Code-style MessagePort IPC over parentPort.
 *-------------------------------------------------------------------------------------------- */

import type { IMessagePassingProtocol } from "@core/ipc/ipc";
import type { IConfigurationRegistry } from "@platform/configuration/common/configuration-registry";

import * as fs from "node:fs";
import * as path from "node:path";
import { Emitter } from "@core/base/event";
import { URI } from "@platform/common/uri/uri";
import { ChannelServer } from "@core/ipc/ipc-server";
import { SyncDescriptor } from "@core/di/descriptors";
import { ProxyChannel } from "@core/ipc/proxy-channel";
import { ILogger } from "@platform/logger/common/logger";
import { IFileService } from "@platform/files/common/files";
import { IDatabaseService } from "@platform/common/database";
import { Registry } from "@platform/registry/common/platform";
import { FileService } from "@platform/files/node/file-service";
import { ServiceCollection } from "@core/di/service-collection";
import { IFileIndexService } from "@platform/common/file-index";
import { IFileSearchService } from "@platform/common/file-search";
import { InstantiationService } from "@core/di/instantiation-service";
import { IFileSystemCrawler } from "@platform/common/file-system-crawler";
import { Extensions } from "@platform/configuration/common/configuration-registry";
import { DiskFileSystemProvider } from "@platform/files/node/disk-file-system-provider";
import { ConfigurationService, IConfigurationService } from "@platform/configuration/common/configuration-service";

import { FdirCrawler } from "./fdir-crawler";
import { DatabaseService } from "./database-service";
import { FileIndexService } from "./file-index-service";
import { FileSearchService } from "./file-search-service";
import { initialSchemaMigration } from "./migrations/001-initial-schema";

const logFile = path.join(process.env.TMPDIR || "/tmp", "atlas-shared-process.log");
function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line);
  }
  catch { /* ignore */ }
}

class ConsoleLogger implements ILogger {
  declare readonly _serviceBrand: undefined;
  critical(message: string): void { log(`[CRITICAL] ${message}`); }
  debug(message: string): void { log(`[DEBUG] ${message}`); }
  error(message: string): void { log(`[ERROR] ${message}`); }
  info(message: string): void { log(`[INFO] ${message}`); }
  trace(message: string): void { log(`[TRACE] ${message}`); }
  warning(message: string): void { log(`[WARNING] ${message}`); }
}

log("=== shared-process-main.ts starting ===");

// In Electron utility process, parentPort is on process.parentPort
const parentPort = (process as any).parentPort;
const userDataPath = process.argv[2];

log(`parentPort available: ${!!parentPort}`);
log(`userDataPath: ${userDataPath}`);

if (!parentPort) {
  log("[shared-process] parentPort is not available");
  process.exit(1);
}

function bootstrapServices(): InstantiationService {
  const dbPath = path.join(userDataPath, "atlas-index.sqlite");
  log(`[shared-process] Database path: ${dbPath}`);

  let databaseService: DatabaseService;
  try {
    databaseService = new DatabaseService(dbPath);
    databaseService.registerMigrations([initialSchemaMigration]);
    databaseService.migrate();
    log("[shared-process] Database initialized successfully");
  }
  catch (err: any) {
    log(`[shared-process] Failed to initialize database: ${err.message}\n${err.stack}`);
    throw err;
  }

  const services = new ServiceCollection();
  services.set(ILogger, new ConsoleLogger());
  services.set(IDatabaseService, databaseService);
  services.set(IFileSystemCrawler, new SyncDescriptor(FdirCrawler));
  services.set(IFileIndexService, new SyncDescriptor(FileIndexService));
  services.set(IFileSearchService, new SyncDescriptor(FileSearchService));
  services.set(IFileService, new SyncDescriptor(FileService));

  const settingsUri = URI.file(path.join(userDataPath, "settings.json"));
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
    log(`[shared-process] Created user data directory: ${userDataPath}`);
  }
  if (!fs.existsSync(settingsUri.fsPath)) {
    fs.writeFileSync(settingsUri.fsPath, "{}", "utf-8");
    log(`[shared-process] Created default settings.json`);
  }
  services.set(IConfigurationService, new SyncDescriptor(ConfigurationService, [settingsUri]));

  // Register default configurations
  Registry.as<IConfigurationRegistry>(Extensions.Configuration).registerConfiguration({
    id: "files",
    order: 1,
    title: "Files",
    type: "object",
    properties: {
      "files.exclude": {
        type: "object",
        markdownDescription: "Configure glob patterns for excluding files and folders.",
        default: {
          "**/node_modules": true,
          "**/.git": true,
          "**/.DS_Store": true,
          "**/Thumbs.db": true,
        },
        scope: 4, // ConfigurationScope.RESOURCE
      },
    },
  });

  const instantiationService = new InstantiationService(services, true);

  // Register disk file system provider for file:// scheme
  instantiationService.invokeFunction((accessor) => {
    const fileService = accessor.get(IFileService);
    fileService.registerProvider("file", new DiskFileSystemProvider());
  });

  return instantiationService;
}

let instantiationService: InstantiationService;
try {
  instantiationService = bootstrapServices();
}
catch (err: any) {
  log(`[shared-process] bootstrapServices failed: ${err.message}\n${err.stack}`);
  process.exit(1);
}

// Initialize configuration service
instantiationService.invokeFunction(async (accessor) => {
  const configurationService = accessor.get<IConfigurationService>(IConfigurationService);
  await configurationService.initialize();
  log("[shared-process] Configuration service initialized");
});

/**
 * Protocol over Node.js MessagePortMain (uses .on('message') / .postMessage)
 */
class MessagePortMainProtocol implements IMessagePassingProtocol {
  private _onMessage = new Emitter<any>();
  readonly onMessage = this._onMessage.event;

  constructor(private port: any) {
    // Node-style event listener for MessagePortMain
    port.on("message", (event: any) => {
      log(`[MessagePortMainProtocol] onmessage data.type=${event.data?.type} id=${event.data?.id} channel=${event.data?.channelName}`);
      this._onMessage.fire(event.data);
    });
    // MUST call start() for messages to flow
    port.start();
    log("[MessagePortMainProtocol] port started (Node-style)");
  }

  send(message: any): void {
    log(`[MessagePortMainProtocol] send type=${message.type} id=${message.id} channel=${message.channelName}`);
    this.port.postMessage(message);
  }
}

function createServerOnPort(port: any): void {
  log("[shared-process] Creating protocol and server for new port");
  const protocol = new MessagePortMainProtocol(port);
  const server = new ChannelServer(protocol);

  const fileIndexService = instantiationService.invokeFunction(accessor => accessor.get(IFileIndexService));
  const fileSearchService = instantiationService.invokeFunction(accessor => accessor.get(IFileSearchService));

  server.registerChannel("fileIndex", ProxyChannel.fromService(fileIndexService));
  server.registerChannel("fileSearch", ProxyChannel.fromService(fileSearchService));

  log("[shared-process] Channels registered on port");
}

// VS Code pattern: listen on parentPort for new MessagePort transfers
parentPort.on("message", (event: any) => {
  log(`[shared-process] Received message from parentPort data=${JSON.stringify(event.data)} portsCount=${event.ports?.length}`);

  const port = event.ports?.at(0);
  if (!port) {
    log("[shared-process] No MessagePort received, ignoring");
    return;
  }

  log("[shared-process] Got MessagePort, creating server");
  createServerOnPort(port);
});

log("[shared-process] Started and ready");

// Keep the utility process alive
setInterval(() => { }, 1 << 30);
