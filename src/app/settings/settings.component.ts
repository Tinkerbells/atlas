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
import { ThemeLoaderService } from '~/theme';
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
  private themeLoader = inject(ThemeLoaderService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  private logger = inject(Logger);

  currentTheme: Theme | null = null;
  availableThemes: string[] = [];
  selectedThemePath: string | null = null;

  ngOnInit(): void {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.loadAvailableThemes();

    const savedThemePath = this.settingsService.get('themePath');
    if (savedThemePath) {
      this.selectedThemePath = savedThemePath;
    }
  }

  loadAvailableThemes(): void {
    const themePath =
      '/Users/user/projects/atlas/apps/angular/src/assets/themes';
    this.availableThemes = this.themeLoader.listAvailableThemes(themePath);
  }

  selectTheme(themePath: string): void {
    this.selectedThemePath = themePath;
    this.themeLoader.loadThemeFromJSON(themePath).subscribe((theme: Theme) => {
      this.themeService.setTheme(theme);
      this.currentTheme = theme;
      this.settingsService.set('themePath', themePath);
      this.settingsService.set('themeName', theme.name);
    });
  }

  resetToDefault(): void {
    this.themeLoader.loadDefaultTheme().subscribe((theme: Theme) => {
      this.themeService.setTheme(theme);
      this.currentTheme = theme;
      this.settingsService.set('themePath', undefined);
      this.settingsService.set('themeName', undefined);
    });
  }

  goBack(): void {
    void this.router.navigate(['/']);
  }
}
