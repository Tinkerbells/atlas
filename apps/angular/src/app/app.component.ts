import { Component, inject } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
import { RouterOutlet } from '@angular/router';
import { KeybindingService } from '~/keybindings/keybindings.service';
import { Logger } from '~/logger';

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

  constructor() {
    const electronService = this.electronService;

    this.translate.setDefaultLang('en');
    this.logger.info('APP_CONFIG', {
      scope: 'AppComponent',
      payload: { config: APP_CONFIG },
    });

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
}
