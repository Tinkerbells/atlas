import { consola } from "consola";
import { InstantiationType, registerSingleton } from "@atlas/di";

import type { LogContext } from "./logger";

import { ILogger } from "./logger";

export class ConsoleLogger implements ILogger {
  declare readonly _serviceBrand: undefined;

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

registerSingleton(ILogger, ConsoleLogger, InstantiationType.Delayed);
