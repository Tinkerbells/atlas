import type { ILogger } from '~/common/logger';
import { loggerService } from './logger-service';

export class Logger implements ILogger {
  readonly _serviceBrand = undefined as undefined;

  constructor() {
    this._interceptConsole();
    this._interceptGlobalErrors();
  }

  debug(message: string, ...args: any[]): void {
    loggerService.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    loggerService.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    loggerService.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    loggerService.log('error', message, ...args);
  }

  private _interceptConsole(): void {
    const originals = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };

    console.log = (...args: any[]) => {
      this.info('[console.log]', ...args);
      originals.log(...args);
    };
    console.info = (...args: any[]) => {
      this.info('[console.info]', ...args);
      originals.info(...args);
    };
    console.warn = (...args: any[]) => {
      this.warn('[console.warn]', ...args);
      originals.warn(...args);
    };
    console.error = (...args: any[]) => {
      this.error('[console.error]', ...args);
      originals.error(...args);
    };
    console.debug = (...args: any[]) => {
      this.debug('[console.debug]', ...args);
      originals.debug(...args);
    };
  }

  private _interceptGlobalErrors(): void {
    window.addEventListener('error', (event) => {
      this.error('[uncaughtException]', event.error);
    });
    window.addEventListener('unhandledrejection', (event) => {
      this.error('[unhandledRejection]', event.reason);
    });
  }
}

export const logger = new Logger();
