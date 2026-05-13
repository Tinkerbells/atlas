/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { ServicesAccessor } from "@core/di/instantiation";
import type { IConfigurationRegistry } from "@platform/configuration/common/configuration-registry";

import { join } from "node:path";
import { app, ipcMain } from "electron";
import { URI } from "@platform/common/uri/uri";
import { SyncDescriptor } from "@core/di/descriptors";
import { ProxyChannel } from "@core/ipc/proxy-channel";
import { ILogger } from "@platform/logger/common/logger";
import { IFileService } from "@platform/files/common/files";
import { Registry } from "@platform/registry/common/platform";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { IInstantiationService } from "@core/di/instantiation";
import { FileService } from "@platform/files/node/file-service";
import { ServiceCollection } from "@core/di/service-collection";
import { Disposable, DisposableStore } from "@core/base/lifecycle";
import { IClipboardService } from "@platform/clipboard/common/clipboard";
import { ElectronIPCServer } from "@core/ipc/electron-main/ipc.electron";
import { INodeProcess } from "@platform/node-process/common/node-process";
import { Extensions } from "@platform/configuration/common/configuration-registry";
import { SharedProcess } from "@platform/shared-process/electron-main/shared-process";
import { ClipboardService } from "@platform/clipboard/electron-main/clipboard-service";
import { IUpdateService, UpdateService } from "@platform/update/electron-main/update-service";
import { ILifecycleMainService, LifecycleMainPhase } from "@platform/lifecycle/common/lifecycle";
import { IEnvironmentMainService } from "@platform/environment/electron-main/environment-main-service";
import { IWindowsMainService, WindowsMainService } from "@platform/windows/electron-main/windows-main-service";
import { ConfigurationService, IConfigurationService } from "@platform/configuration/common/configuration-service";
import { INativeHostMainService, NativeHostMainService } from "@platform/native-host/electron-main/native-host-main-service";

import type { AppInitConfig } from "./app-init-config";

export class Application extends Disposable {
  constructor(
    private readonly initConfig: AppInitConfig,
    @IInstantiationService private readonly mainInstantiationService: IInstantiationService,
    @ILogger private readonly logService: ILogger,
    @ILifecycleMainService private readonly lifecycleMainService: ILifecycleMainService,
    @IEnvironmentMainService private readonly environmentMainService: IEnvironmentMainService,
  ) {
    super();
  }

  async startup(): Promise<void> {
    this.logService.info("Starting Atlas application...");

    // Configure Electron session security
    this.configureSession();

    // Create the main IPC server (multi-connection)
    const electronIpcServer = this._register(new ElectronIPCServer());

    // Setup shared process
    const sharedProcess = this.setupSharedProcess();

    // Register handler for renderer requesting shared process port
    this._registerSharedProcessPortHandler(sharedProcess);

    // Create child DI container with application-level services
    const appInstantiationService = await this.initServices();

    // Initialize configuration service
    await appInstantiationService.invokeFunction(async (accessor) => {
      const configurationService = accessor.get<IConfigurationService>(IConfigurationService);
      await configurationService.initialize();
    });

    // Register IPC channels
    appInstantiationService.invokeFunction(accessor => this.initChannels(accessor, electronIpcServer));

    // Open first window
    await appInstantiationService.invokeFunction(accessor => this.openFirstWindow(accessor));

    // Set lifecycle phase to Ready
    this.lifecycleMainService.setPhase(LifecycleMainPhase.Ready);

    this.logService.info("Atlas application started successfully.");
  }

  private setupSharedProcess(): SharedProcess {
    const sharedProcess = this._register(new SharedProcess(this.initConfig.sharedProcess.path, this.environmentMainService.userDataPath));
    sharedProcess.spawn();

    // Connect main to shared process
    sharedProcess.onDidExit((code) => {
      this.logService.warning(`Shared process exited with code ${code}`);
    });

    // Connect after a short delay to allow spawn
    setTimeout(() => {
      sharedProcess.connect().catch((err) => {
        this.logService.error("Failed to connect to shared process:", err);
      });
    }, 100);

    return sharedProcess;
  }

  private _registerSharedProcessPortHandler(sharedProcess: SharedProcess): void {
    const handler = async (event: Electron.IpcMainEvent, nonce: string) => {
      console.log("[main] Received app:requestSharedProcessPort, nonce:", nonce);
      const webContents = event.sender;
      try {
        const port = await sharedProcess.createConnection(webContents);
        console.log("[main] Created shared process connection, posting port to renderer");
        // VS Code: webContents.postMessage(responseChannel, responseNonce, [windowPort])
        webContents.postMessage("app:receiveSharedProcessPort", nonce, [port]);
      }
      catch (err) {
        console.error("[main] Failed to create shared process port:", err);
        this.logService.error(`Failed to create shared process port: ${err}`);
      }
    };

    ipcMain.on("app:requestSharedProcessPort", handler);
    this._register({
      dispose: () => ipcMain.removeListener("app:requestSharedProcessPort", handler),
    });
  }

  private configureSession(): void {
    // Security: block navigation to unknown origins
    app.on("web-contents-created", (_event, contents) => {
      contents.on("will-navigate", (event, url) => {
        const parsedUrl = new URL(url);
        if (parsedUrl.origin !== "null" && parsedUrl.protocol !== "file:") {
          this.logService.warning(`Blocked navigation to: ${url}`);
          event.preventDefault();
        }
      });

      contents.setWindowOpenHandler(({ url }) => {
        const allowed = new Set([
          ...(this.initConfig.renderer instanceof URL ? [this.initConfig.renderer.origin] : []),
          ...(process.env.MODE === "development"
            ? ["https://vite.dev", "https://developer.mozilla.org", "https://vuejs.org"]
            : []),
        ]);

        if (allowed.has(new URL(url).origin)) {
          import("electron").then(({ shell }) => shell.openExternal(url));
        }
        return { action: "deny" };
      });
    });
  }

  private async initServices(): Promise<IInstantiationService> {
    const services = new ServiceCollection();

    services.set(IWindowsMainService, new SyncDescriptor(WindowsMainService, [this.initConfig]));
    services.set(INativeHostMainService, new SyncDescriptor(NativeHostMainService));
    services.set(IUpdateService, new SyncDescriptor(UpdateService));
    services.set(IClipboardService, new SyncDescriptor(ClipboardService));
    services.set(IFileService, new SyncDescriptor(FileService));

    const userDataPath = this.environmentMainService.userDataPath;
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true });
    }
    const settingsUri = URI.file(join(userDataPath, "settings.json"));
    if (!existsSync(settingsUri.fsPath)) {
      writeFileSync(settingsUri.fsPath, "{}", "utf-8");
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

    return this.mainInstantiationService.createChild(services, this._store);
  }

  private initChannels(
    accessor: ServicesAccessor,
    electronIpcServer: ElectronIPCServer,
  ): void {
    this._register(new DisposableStore());

    const logger = accessor.get(ILogger);
    const nodeProcess = accessor.get(INodeProcess);
    const nativeHost = accessor.get(INativeHostMainService);
    const clipboard = accessor.get(IClipboardService);
    const configurationService = accessor.get<IConfigurationService>(IConfigurationService);

    const loggerChannel = ProxyChannel.fromService(logger);
    const nodeProcessChannel = ProxyChannel.fromService(nodeProcess);
    const nativeHostChannel = ProxyChannel.fromService(nativeHost);
    const clipboardChannel = ProxyChannel.fromService(clipboard);
    const configurationChannel = ProxyChannel.fromService(configurationService);

    // Register on main IPC server (renderer access)
    electronIpcServer.registerChannel("logger", loggerChannel);
    electronIpcServer.registerChannel("nodeProcess", nodeProcessChannel);
    electronIpcServer.registerChannel("nativeHost", nativeHostChannel);
    electronIpcServer.registerChannel("clipboard", clipboardChannel);
    electronIpcServer.registerChannel("configuration", configurationChannel);

    // TODO: Register channels on shared process when needed
  }

  private async openFirstWindow(accessor: ServicesAccessor): Promise<void> {
    const windowsMainService = accessor.get(IWindowsMainService);
    await windowsMainService.openFirstWindow();

    this.lifecycleMainService.setPhase(LifecycleMainPhase.AfterWindowOpen);
  }
}
