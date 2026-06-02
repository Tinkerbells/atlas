import { createDecorator } from "~/common/di";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ILogger {
  readonly _serviceBrand: undefined;
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

export const ILogger = createDecorator<ILogger>("logger");
