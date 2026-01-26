import { Injectable, inject } from '@angular/core';
import { LumberjackService } from '@ngworker/lumberjack';
import { LogContext, Logger } from './logger';

@Injectable({ providedIn: 'root' })
export class LoggerAdapterService implements Logger {
  private readonly lumberjack = inject(LumberjackService);

  critical(message: string, context?: LogContext): void {
    this.lumberjack.logCritical(message, context?.scope);
  }

  debug(message: string, context?: LogContext): void {
    this.lumberjack.logDebug(message, context?.scope);
  }

  error(message: string, context?: LogContext): void {
    this.lumberjack.logError(message, context?.scope);
  }

  info(message: string, context?: LogContext): void {
    this.lumberjack.logInfo(message, context?.scope);
  }

  trace(message: string, context?: LogContext): void {
    this.lumberjack.logTrace(message, context?.scope);
  }

  warning(message: string, context?: LogContext): void {
    this.lumberjack.logWarning(message, context?.scope);
  }
}
