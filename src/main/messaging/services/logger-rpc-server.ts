import type { ILogger } from "~/common/logger";
import type { RemoteLoggerServer } from "~/common/messaging/service-protocols";

export class LoggerRpcServer implements RemoteLoggerServer {
  constructor(private readonly logger: ILogger) {}

  async log(level: string, message: string, ...args: unknown[]): Promise<void> {
    switch (level) {
      case "debug":
        this.logger.debug(message, ...args);
        break;
      case "info":
        this.logger.info(message, ...args);
        break;
      case "warn":
        this.logger.warn(message, ...args);
        break;
      case "error":
        this.logger.error(message, ...args);
        break;
      default:
        this.logger.info(message, ...args);
    }
  }
}
