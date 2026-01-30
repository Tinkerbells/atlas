import { InjectionToken } from '@angular/core';

export enum LogLevel {
  Critical = 'critical',
  Debug = 'debug',
  Error = 'error',
  Info = 'info',
  Trace = 'trace',
  Warning = 'warning',
}

export interface LogContext {
  scope?: string;
  payload?: Record<string, unknown>;
}

export interface Logger {
  critical(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  trace(message: string, context?: LogContext): void;
  warning(message: string, context?: LogContext): void;
}

export const Logger = new InjectionToken<Logger>('Logger');
