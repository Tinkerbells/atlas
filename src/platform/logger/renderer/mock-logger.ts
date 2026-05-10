import type { ILogger, LogContext } from "@/platform/logger/common/logger";

function noop() {}

export function createMockLogger(): ILogger {
  return {
    _serviceBrand: undefined,
    critical: noop,
    debug: noop,
    error: noop,
    info: noop,
    trace: noop,
    warning: noop,
  };
}

type LogMethodKeys = "critical" | "debug" | "error" | "info" | "trace" | "warning";

export function createTrackingLogger(): {
  logger: ILogger;
  calls: Record<LogMethodKeys, Array<{ message: string; context?: LogContext }>>;
} {
  const calls: Record<LogMethodKeys, Array<{ message: string; context?: LogContext }>> = {
    critical: [],
    debug: [],
    error: [],
    info: [],
    trace: [],
    warning: [],
  };

  const logger: ILogger = {
    _serviceBrand: undefined,
    critical: (message, context) => { calls.critical.push({ message, context }); },
    debug: (message, context) => { calls.debug.push({ message, context }); },
    error: (message, context) => { calls.error.push({ message, context }); },
    info: (message, context) => { calls.info.push({ message, context }); },
    trace: (message, context) => { calls.trace.push({ message, context }); },
    warning: (message, context) => { calls.warning.push({ message, context }); },
  };

  return { logger, calls };
}
