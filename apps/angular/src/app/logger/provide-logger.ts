import { Provider } from '@angular/core';
import { provideLumberjack } from '@ngworker/lumberjack';
import { provideLumberjackConsoleDriver } from '@ngworker/lumberjack/console-driver';
import { LoggerAdapterService } from './logger.service';
import { Logger } from './logger';

export function provideLogger(): Provider[] {
  return [
    provideLumberjack(),
    provideLumberjackConsoleDriver(),
    {
      provide: Logger,
      useClass: LoggerAdapterService,
    },
  ];
}
