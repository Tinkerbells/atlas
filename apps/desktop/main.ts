import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AppComponent } from './src/app/app.component';
import { APP_CONFIG } from './src/environments/environment';
import { CoreModule } from './src/app/core/core.module';
import { SharedModule } from './src/app/common/common.module';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { PageNotFoundComponent } from './src/app/common/components';
import { HomeComponent } from './src/app/home/home.component';
import { DetailComponent } from './src/app/detail/detail.component';
import { SettingsComponent } from './src/app/settings';
import { provideLogger } from './src/app/logger';
import { providePrimeNG } from 'primeng/config';
import Material from '@primeuix/themes/material';

if (APP_CONFIG.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideLogger(),
    provideZoneChangeDetection(),
    provideHttpClient(withInterceptorsFromDi()),
    providePrimeNG({
      theme: {
        preset: Material,
      },
    }),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './src/assets/i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'en',
      lang: 'en',
    }),
    provideRouter([
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        component: HomeComponent,
      },
      {
        path: 'detail',
        component: DetailComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
      {
        path: '**',
        component: PageNotFoundComponent,
      },
    ]),
    importProvidersFrom(CoreModule, SharedModule),
  ],
}).catch((err) => console.error(err));
