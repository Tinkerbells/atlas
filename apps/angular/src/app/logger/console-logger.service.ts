import { Injectable } from '@angular/core';
import { consola } from 'consola';
import { LogContext, Logger } from './logger';

@Injectable({ providedIn: 'root' })
export class ConsoleLoggerService implements Logger {
  critical(message: string, context?: LogContext): void {
    const logger = this.getLogger(context);
    logger.fatal(message, context?.payload);
  }

  debug(message: string, context?: LogContext): void {
    const logger = this.getLogger(context);
    logger.debug(message, context?.payload);
  }

  error(message: string, context?: LogContext): void {
    const logger = this.getLogger(context);
    logger.error(message, context?.payload);
  }

  info(message: string, context?: LogContext): void {
    const logger = this.getLogger(context);
    logger.info(message, context?.payload);
  }

  trace(message: string, context?: LogContext): void {
    const logger = this.getLogger(context);
    logger.trace(message, context?.payload);
  }

  warning(message: string, context?: LogContext): void {
    const logger = this.getLogger(context);
    logger.warn(message, context?.payload);
  }

  private getLogger(context?: LogContext) {
    return context?.scope ? consola.withTag(context.scope) : consola;
  }
}
