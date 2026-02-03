import { provideEnvironmentInitializer, inject, Provider } from '@angular/core';
import { ThemeService } from './theme.service';

export function provideTheme(): Provider {
  return [
    provideEnvironmentInitializer(() => {
      const themeService = inject(ThemeService);
      themeService.initializeWithDefault();
    }),
  ];
}
