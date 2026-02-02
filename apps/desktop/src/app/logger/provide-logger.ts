import { Provider } from '@angular/core';
import { ConsoleLoggerService } from './console-logger.service';
import { Logger } from './logger';

export function provideLogger(): Provider[] {
  return [
    {
      provide: Logger,
      useClass: ConsoleLoggerService,
    },
  ];
}
