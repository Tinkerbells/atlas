import { app } from "electron";
import { join } from "node:path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";

import { ILogger } from "~/common/logger";
import { IBridgeRouter } from "~/main/bridge/BridgeRouter";
import { IWindowManager } from "~/main/windows/WindowManager";
import { createDecorator, InstantiationType, registerSingleton } from "~/common/di";

export interface ILifecycleManager {
  readonly _serviceBrand: undefined;
  start: () => void;
}

export const ILifecycleManager = createDecorator<ILifecycleManager>("lifecycleManager");

function loadWindowContent(window: Electron.BrowserWindow): void {
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL);
  }
  else {
    window.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

export class LifecycleManager implements ILifecycleManager {
  readonly _serviceBrand: undefined;

  constructor(
    @IWindowManager private readonly windowManager: IWindowManager,
    @IBridgeRouter private readonly bridgeRouter: IBridgeRouter,
    @ILogger private readonly logger: ILogger,
  ) { }

  start(): void {
    app.whenReady().then(() => {
      // Set app user model id for windows
      electronApp.setAppUserModelId("com.electron");

      // Default open or close DevTools by F12 in development
      // and ignore CommandOrControl + R in production.
      // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
      app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window);
      });

      // Register IPC handlers via BridgeRouter
      this.bridgeRouter.register("ping", async () => {
        this.logger.info("IPC received: ping -> pong");
        return "pong";
      });
      this.logger.info("IPC handler 'ping' registered via BridgeRouter");

      // Create main window
      this.windowManager.createMainWindow({
        onWindowReady: (window) => {
          loadWindowContent(window);
        },
      });
    });

    app.on("activate", () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (this.windowManager.getAllWindows().length === 0) {
        this.windowManager.createMainWindow({
          onWindowReady: (window) => {
            loadWindowContent(window);
          },
        });
      }
    });

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });
  }
}

registerSingleton(ILifecycleManager, LifecycleManager, InstantiationType.Eager);
