import type { LogLevel } from "./logger";

export const loggerIpcChannel = "logger:log";

export interface ILoggerQueries {
  [loggerIpcChannel]: (level: LogLevel, message: string, ...args: any[]) => Promise<void>;
}

export interface ILoggerEvents {
  // Пример: 'logger:config-changed': (config: LogConfig) => void;
}
