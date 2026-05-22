import { join } from "node:path";
import { injectable } from "inversify";
import { BrowserWindow, shell } from "electron";

import icon from "../../../resources/icon.png?asset";

export interface CreateMainWindowOptions {
  width?: number;
  height?: number;
  preload?: string;
  onWindowReady?: (window: BrowserWindow) => void;
}

@injectable()
export class WindowManager {
  private windows = new Map<string, BrowserWindow>();

  createMainWindow(options: CreateMainWindowOptions = {}): BrowserWindow {
    const existingWindow = this.getMainWindow();
    if (existingWindow) {
      return existingWindow;
    }

    const {
      width = 900,
      height = 670,
      preload = join(__dirname, "../../preload/index.js"),
      onWindowReady,
    } = options;

    const mainWindow = new BrowserWindow({
      width,
      height,
      show: false,
      autoHideMenuBar: true,
      ...(process.platform === "linux" ? { icon } : {}),
      webPreferences: {
        preload,
        sandbox: true,
      },
    });

    mainWindow.on("ready-to-show", () => {
      mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });

    this.windows.set("main", mainWindow);

    if (onWindowReady) {
      onWindowReady(mainWindow);
    }

    return mainWindow;
  }

  getMainWindow(): BrowserWindow | undefined {
    return this.windows.get("main");
  }

  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values());
  }

  closeMainWindow(): void {
    const mainWindow = this.windows.get("main");
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
    this.windows.delete("main");
  }

  closeWindow(id: string): void {
    const window = this.windows.get(id);
    if (window && !window.isDestroyed()) {
      window.close();
    }
    this.windows.delete(id);
  }

  closeAllWindows(): void {
    for (const [, window] of this.windows) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }
    this.windows.clear();
  }
}
