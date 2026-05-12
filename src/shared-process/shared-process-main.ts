/* ---------------------------------------------------------------------------------------------
 *  Shared process entry point — VS Code-style MessagePort IPC over parentPort.
 *-------------------------------------------------------------------------------------------- */

import type { IMessagePassingProtocol } from "@core/ipc/ipc";

import * as fs from "node:fs";
import * as path from "node:path";
import { Emitter } from "@core/base/event";
import { ChannelServer } from "@core/ipc/ipc-server";
import { SyncDescriptor } from "@core/di/descriptors";
import { ProxyChannel } from "@core/ipc/proxy-channel";
import { IDatabaseService } from "@platform/common/database";
import { ServiceCollection } from "@core/di/service-collection";
import { IFileIndexService } from "@platform/common/file-index";
import { IFileSearchService } from "@platform/common/file-search";
import { InstantiationService } from "@core/di/instantiation-service";
import { IFileSystemCrawler } from "@platform/common/file-system-crawler";

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
  services.set(IDatabaseService, databaseService);
  services.set(IFileSystemCrawler, new SyncDescriptor(FdirCrawler));
  services.set(IFileIndexService, new SyncDescriptor(FileIndexService));
  services.set(IFileSearchService, new SyncDescriptor(FileSearchService));

  return new InstantiationService(services, true);
}

let instantiationService: InstantiationService;
try {
  instantiationService = bootstrapServices();
}
catch (err: any) {
  log(`[shared-process] bootstrapServices failed: ${err.message}\n${err.stack}`);
  process.exit(1);
}

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
