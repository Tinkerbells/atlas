import type { ILogger, LogContext } from "@platform/logger/common/logger";

import { dirname } from "node:path";
import { appendFileSync, existsSync, mkdirSync } from "node:fs";

export class FileLogger implements ILogger {
  declare readonly _serviceBrand: undefined;
  private readonly logPath: string;

  constructor(logsHome: string) {
    this.logPath = `${logsHome}/atlas.log`;
    const dir = dirname(this.logPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  critical(message: string, context?: LogContext): void {
    this._log("CRITICAL", message, context);
  }

  debug(message: string, context?: LogContext): void {
    this._log("DEBUG", message, context);
  }

  error(message: string, context?: LogContext): void {
    this._log("ERROR", message, context);
  }

  info(message: string, context?: LogContext): void {
    this._log("INFO", message, context);
  }

  trace(message: string, context?: LogContext): void {
    this._log("TRACE", message, context);
  }

  warning(message: string, context?: LogContext): void {
    this._log("WARNING", message, context);
  }

  private _log(level: string, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const scope = context?.scope ? `[${context.scope}]` : "";
    const line = `${timestamp} ${level} ${scope} ${message}\n`;
    try {
      appendFileSync(this.logPath, line);
    }
    catch {
      // ignore
    }

    console.log(line.trim());
  }
}
