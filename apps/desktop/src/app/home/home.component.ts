import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { IKeybindingsRegistry, ScanCode, ScanCodeMod } from '~/keybindings';
import { ICommandRegistry } from '~/commands';
import { Logger } from '~/logger';
import { SidebarComponent } from '~/common/ui/sidebar';

@Component({
  selector: 'app-home',
  template: `
    <app-sidebar>
      <div>hello</div>
    </app-sidebar>
  `,
  standalone: true,
  imports: [TranslateModule, SidebarComponent],
})
export class HomeComponent implements OnInit {
  private readonly keybindingsRegistry = inject(IKeybindingsRegistry);
  private readonly commandsRegistry = inject(ICommandRegistry);
  private readonly logger = inject(Logger);
  constructor() {}
  ngOnInit() {
    this.commandsRegistry.registerCommand('demo.sayHello1', () =>
      console.log('Hello World!'),
    );
    this.keybindingsRegistry.registerKeybindingRule({
      id: 'demo.sayHello1',
      weight: 100,
      when: undefined,
      primary: ScanCodeMod.CtrlCmd | ScanCode.KeyF,
      mac: {
        primary: ScanCodeMod.WinCtrl | ScanCode.KeyF,
      },
    });
    this.logger.info('HomeComponent INIT', { scope: 'HomeComponent' });
  }
}
