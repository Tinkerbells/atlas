import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { KeybindingService } from '~/keybindings/keybindings.service';
import { Logger } from '~/logger';
import { ThemeService, ThemeLoaderService, Theme } from '~/theme';
import { SettingsService } from '~/settings';
import { ElectronService } from '~/core/services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet],
})
export class AppComponent {
  private electronService = inject(ElectronService);
  private translate = inject(TranslateService);
  private readonly logger: Logger = inject(Logger);
  private _keybindingService = inject(KeybindingService);
  private themeService = inject(ThemeService);
  private themeLoader = inject(ThemeLoaderService);
  private settingsService = inject(SettingsService);

  constructor() {
    const electronService = this.electronService;

    this.translate.setDefaultLang('en');

    this.initializeTheme();

    if (electronService.isElectron) {
      this.logger.info('Run in electron', {
        scope: 'AppComponent',
        payload: { env: process.env },
      });
      this.logger.debug('Electron ipcRenderer', {
        scope: 'AppComponent',
        payload: { ipcRenderer: this.electronService.ipcRenderer },
      });
      this.logger.debug('NodeJS childProcess', {
        scope: 'AppComponent',
        payload: { childProcess: this.electronService.childProcess },
      });
    } else {
      this.logger.info('Run in browser', { scope: 'AppComponent' });
    }
  }

  // TODO: лучше вынести
  private initializeTheme(): void {
    const savedThemePath = this.settingsService.get('themePath');

    if (savedThemePath) {
      this.themeLoader.loadThemeFromJSON(savedThemePath).subscribe({
        next: (theme: Theme) => {
          this.themeService.setTheme(theme);
          this.logger.info(`Loaded theme: ${theme.name}`, {
            scope: 'AppComponent',
          });
        },
        error: (err: unknown) => {
          this.logger.error('Failed to load saved theme', {
            scope: 'AppComponent',
            payload: { error: err },
          });
          this.loadDefaultTheme();
        },
      });
    } else {
      this.loadDefaultTheme();
    }
  }

  private loadDefaultTheme(): void {
    this.themeLoader.loadDefaultTheme().subscribe({
      next: (theme: Theme) => {
        this.themeService.setTheme(theme);
        this.logger.info(`Loaded default theme: ${theme.name}`, {
          scope: 'AppComponent',
        });
      },
      error: (err: unknown) => {
        this.logger.error('Failed to load default theme', {
          scope: 'AppComponent',
          payload: { error: err },
        });
      },
    });
  }
}
