import type { IChannel } from "@core/ipc/ipc";
import type { ILogger, LogContext } from "@platform/logger/common/logger";

import { createChannelProxy } from "@core/ipc/channel";

export class LoggerChannelClient implements ILogger {
  declare readonly _serviceBrand: undefined;

  critical: (message: string, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  trace: (message: string, context?: LogContext) => void;
  warning: (message: string, context?: LogContext) => void;

  constructor(channel: IChannel) {
    const proxy = createChannelProxy<ILogger>(channel, [
      "critical",
      "debug",
      "error",
      "info",
      "trace",
      "warning",
    ]);
    this.critical = proxy.critical;
    this.debug = proxy.debug;
    this.error = proxy.error;
    this.info = proxy.info;
    this.trace = proxy.trace;
    this.warning = proxy.warning;
  }
}
