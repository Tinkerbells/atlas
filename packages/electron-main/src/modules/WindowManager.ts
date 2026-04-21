import { BrowserWindow } from "electron";

import type { AppModule } from "../AppModule.js";
import type { AppInitConfig } from "../AppInitConfig.js";
import type { ModuleContext } from "../ModuleContext.js";

class WindowManager implements AppModule {
  readonly #preload: { path: string };
  readonly #renderer: { path: string } | URL;
  readonly #openDevTools;

  constructor({ initConfig, openDevTools = false }: { initConfig: AppInitConfig; openDevTools?: boolean }) {
    this.#preload = initConfig.preload;
    this.#renderer = initConfig.renderer;
    this.#openDevTools = openDevTools;
  }

  async enable({ app }: ModuleContext): Promise<void> {
    await app.whenReady();
    await this.restoreOrCreateWindow();
    app.on("second-instance", () => this.restoreOrCreateWindow());
    app.on("activate", () => this.restoreOrCreateWindow());
  }

  async createWindow(): Promise<BrowserWindow> {
    const browserWindow = new BrowserWindow({
      title: "Atlas",
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
        webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
        preload: this.#preload.path,
      },
    });

    browserWindow.once("ready-to-show", () => {
      browserWindow.show();
      if (this.#openDevTools) {
        browserWindow.webContents.openDevTools();
      }
      browserWindow.focus();
    });

    if (this.#renderer instanceof URL) {
      await browserWindow.loadURL(this.#renderer.href).catch((e) => {
        if (!e.message.includes("ERR_ABORTED"))
          throw e;
      });
    }
    else {
      await browserWindow.loadFile(this.#renderer.path);
    }

    return browserWindow;
  }

  async restoreOrCreateWindow() {
    let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

    if (window === undefined) {
      window = await this.createWindow();
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window.focus();

    return window;
  }
}

export function createWindowManagerModule(...args: ConstructorParameters<typeof WindowManager>) {
  return new WindowManager(...args);
}
