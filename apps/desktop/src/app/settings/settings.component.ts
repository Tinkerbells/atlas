import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';

import { Theme } from '~/theme';
import { SettingsService } from '~/settings';
import { ThemeService } from '~/theme';
import { Logger } from '~/logger';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatList,
    MatListItem,
    MatButtonModule,
    MatDivider,
    MatIcon,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  private themeService = inject(ThemeService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  private logger = inject(Logger);

  currentTheme: Theme | null = null;

  ngOnInit(): void {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  goBack(): void {
    void this.router.navigate(['/']);
  }
}
