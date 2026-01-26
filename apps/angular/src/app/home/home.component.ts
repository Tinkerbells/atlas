import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';

import { Listbox, Option } from '@angular/aria/listbox';

import { MatIconModule } from '@angular/material/icon';

import {
  AccordionGroup,
  AccordionTrigger,
  AccordionPanel,
  AccordionContent,
} from '@angular/aria/accordion';
import { IKeybindingsRegistry } from '~/keybindings';
import { ICommandRegistry } from '~/commands';
import { Logger } from '~/logger';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSidenavModule,
    AccordionGroup,
    AccordionTrigger,
    AccordionPanel,
    AccordionContent,
    Listbox,
    Option,
  ],
})
export class HomeComponent implements OnInit {
  private readonly keybindingsRegistry: IKeybindingsRegistry =
    inject(IKeybindingsRegistry);
  private readonly commandsRegistry: ICommandRegistry =
    inject(ICommandRegistry);
  private readonly logger: Logger = inject(Logger);
  constructor() {}
  public options = ['Option 1', 'Option 2', 'Option 3'];
  ngOnInit(): void {
    this.commandsRegistry.registerCommand('demo.sayHello1', () =>
      this.logger.info('Hello World!', { scope: 'HomeComponent' }),
    );
    this.keybindingsRegistry.registerKeybindingRule({
      id: 'demo.sayHello1',
      weight: 100,
      when: undefined,
      primary: 'ctrl+KeyC',
      mac: {
        primary: 'meta+KeyC',
      },
    });
    this.logger.info('HomeComponent INIT', { scope: 'HomeComponent' });
  }
}
