import log from "electron-log";

import type { LogLevel } from "~/common/logger/logger";

import { ILogger } from "~/common/logger";
import { loggerIpcChannel } from "~/common/logger/logger-protocol";
import { IBridgeRouter } from "~/main/bridge/BridgeRouter";
import { InstantiationType, registerSingleton } from "~/common/di";

export class LoggerService implements ILogger {
  readonly _serviceBrand = undefined as undefined;

  constructor(
    @IBridgeRouter private readonly bridgeRouter: IBridgeRouter,
  ) {
    // Configure electron-log transports
    log.transports.file.level = "info";
    log.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB

    if (process.env.NODE_ENV !== "production") {
      log.transports.console.level = "debug";
    }
    else {
      log.transports.console.level = false;
    }

    // Register bridge handler for renderer logs
    this.bridgeRouter.register(loggerIpcChannel, async (level: LogLevel, message: string, ...args: any[]) => {
      this._logFromRenderer(level, message, ...args);
    });

    this._interceptConsole();
    this._interceptGlobalErrors();
  }

  debug(message: string, ...args: any[]): void {
    log.debug(`[Main] ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    log.info(`[Main] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    log.warn(`[Main] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    log.error(`[Main] ${message}`, ...args);
  }

  private _logFromRenderer(level: LogLevel, message: string, ...args: any[]): void {
    const prefix = "[Renderer]";
    switch (level) {
      case "debug":
        log.debug(`${prefix} ${message}`, ...args);
        break;
      case "info":
        log.info(`${prefix} ${message}`, ...args);
        break;
      case "warn":
        log.warn(`${prefix} ${message}`, ...args);
        break;
      case "error":
        log.error(`${prefix} ${message}`, ...args);
        break;
    }
  }

  private _interceptConsole(): void {
    const originals = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };

    console.log = (...args: any[]) => {
      log.info("[Main] [console.log]", ...args);
      originals.log(...args);
    };
    console.info = (...args: any[]) => {
      log.info("[Main] [console.info]", ...args);
      originals.info(...args);
    };
    console.warn = (...args: any[]) => {
      log.warn("[Main] [console.warn]", ...args);
      originals.warn(...args);
    };
    console.error = (...args: any[]) => {
      log.error("[Main] [console.error]", ...args);
      originals.error(...args);
    };
    console.debug = (...args: any[]) => {
      log.debug("[Main] [console.debug]", ...args);
      originals.debug(...args);
    };
  }

  private _interceptGlobalErrors(): void {
    process.on("uncaughtException", (error) => {
      log.error("[Main] [uncaughtException]", error);
    });
    process.on("unhandledRejection", (reason) => {
      log.error("[Main] [unhandledRejection]", reason);
    });
  }
}

registerSingleton(ILogger, LoggerService, InstantiationType.Eager);
