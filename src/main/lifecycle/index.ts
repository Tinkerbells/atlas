import { join } from "node:path";
import { app, ipcMain } from "electron";
import { inject, injectable } from "inversify";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";

import type { WindowManager } from "../windows";

import { Services } from "../../common/di/types";

function loadWindowContent(window: Electron.BrowserWindow): void {
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL);
  }
  else {
    window.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

@injectable()
export class LifecycleManager {
  constructor(
    @inject(Services.WindowManager) private readonly windowManager: WindowManager,
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

      // IPC test
      ipcMain.on("ping", () => console.log("[Main] IPC received: ping -> pong"));
      console.log("[Main] IPC handler 'ping' registered");

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
