import { Injectable, inject } from '@angular/core';
import { Theme } from './theme';
import { ElectronService } from '~/core/services';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private electronService = inject(ElectronService);
  private currentTheme: Theme | null = null;

  constructor() {}

  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.applyCSSVariables(theme);
    this.applyMaterialTheme(theme);
  }

  updateVariable(variableName: string, value: string): void {
    document.documentElement.style.setProperty(variableName, value);

    if (this.currentTheme) {
      const token = this.currentTheme.tokens.find(
        (t) => t.name === variableName,
      );
      if (token) {
        token.value = value;
      }
    }
  }

  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  private applyCSSVariables(theme: Theme): void {
    const root = document.documentElement;

    theme.tokens.forEach((token) => {
      root.style.setProperty(token.name, token.value);
    });

    root.style.setProperty(
      '--atlas-bg-primary',
      theme.semantic.colors.background.primary,
    );
    root.style.setProperty(
      '--atlas-bg-secondary',
      theme.semantic.colors.background.secondary ||
        theme.semantic.colors.background.primary,
    );
    root.style.setProperty(
      '--atlas-surface-primary',
      theme.semantic.colors.surface.primary,
    );
    root.style.setProperty(
      '--atlas-surface-secondary',
      theme.semantic.colors.surface.secondary ||
        theme.semantic.colors.surface.primary,
    );

    root.style.setProperty(
      '--atlas-text-primary',
      theme.semantic.colors.text.primary,
    );
    root.style.setProperty(
      '--atlas-text-secondary',
      theme.semantic.colors.text.secondary ||
        theme.semantic.colors.text.primary,
    );

    root.style.setProperty(
      '--atlas-border-primary',
      theme.semantic.colors.border.primary,
    );
    root.style.setProperty(
      '--atlas-border-secondary',
      theme.semantic.colors.border.secondary ||
        theme.semantic.colors.border.primary,
    );

    root.style.setProperty(
      '--atlas-primary',
      theme.semantic.colors.primary.primary,
    );
    root.style.setProperty(
      '--atlas-primary-dark',
      theme.semantic.colors.primary.secondary ||
        theme.semantic.colors.primary.primary,
    );

    root.style.setProperty(
      '--atlas-accent',
      theme.semantic.colors.accent.primary,
    );
    root.style.setProperty(
      '--atlas-accent-hover',
      theme.semantic.colors.accent.secondary ||
        theme.semantic.colors.accent.primary,
    );

    root.style.setProperty(
      '--atlas-error',
      theme.semantic.colors.border.error || '#f55e57',
    );
    root.style.setProperty(
      '--atlas-success',
      theme.semantic.colors.border.success || '#1aa64a',
    );

    root.style.setProperty('--atlas-spacing-xs', theme.semantic.spacing.xs);
    root.style.setProperty('--atlas-spacing-s', theme.semantic.spacing.s);
    root.style.setProperty('--atlas-spacing-m', theme.semantic.spacing.m);
    root.style.setProperty('--atlas-spacing-l', theme.semantic.spacing.l);
    root.style.setProperty('--atlas-spacing-xl', theme.semantic.spacing.xl);
    root.style.setProperty('--atlas-spacing-xxl', theme.semantic.spacing.xxl);
    root.style.setProperty('--atlas-spacing-xxxl', theme.semantic.spacing.xxxl);

    root.style.setProperty('--atlas-radius-none', theme.semantic.shape.none);
    root.style.setProperty('--atlas-radius-sm', theme.semantic.shape.small);
    root.style.setProperty('--atlas-radius-md', theme.semantic.shape.medium);
    root.style.setProperty('--atlas-radius-lg', theme.semantic.shape.large);
    root.style.setProperty('--atlas-radius-full', theme.semantic.shape.full);

    root.style.setProperty(
      '--atlas-text-body-large',
      `${theme.semantic.typography.fontSize.lg}/${theme.semantic.typography.lineHeight.normal}`,
    );
    root.style.setProperty(
      '--atlas-text-body-medium',
      `${theme.semantic.typography.fontSize.base}/${theme.semantic.typography.lineHeight.normal}`,
    );
    root.style.setProperty(
      '--atlas-text-body-small',
      `${theme.semantic.typography.fontSize.sm}/${theme.semantic.typography.lineHeight.tight}`,
    );

    root.style.setProperty(
      '--atlas-text-heading-large',
      `${theme.semantic.typography.fontSize['4xl']}/${theme.semantic.typography.lineHeight.tight}`,
    );
    root.style.setProperty(
      '--atlas-text-heading-medium',
      `${theme.semantic.typography.fontSize['2xl']}/${theme.semantic.typography.lineHeight.tight}`,
    );
    root.style.setProperty(
      '--atlas-text-heading-small',
      `${theme.semantic.typography.fontSize.xl}/${theme.semantic.typography.lineHeight.tight}`,
    );

    root.style.setProperty('--atlas-elevation-0', theme.semantic.shadows.none);
    root.style.setProperty('--atlas-elevation-1', theme.semantic.shadows.xs);
    root.style.setProperty('--atlas-elevation-2', theme.semantic.shadows.sm);
    root.style.setProperty('--atlas-elevation-3', theme.semantic.shadows.md);
    root.style.setProperty('--atlas-elevation-4', theme.semantic.shadows.lg);
    root.style.setProperty('--atlas-elevation-5', theme.semantic.shadows.xl);

    root.style.setProperty(
      '--atlas-duration-fast',
      theme.semantic.motion.duration.fast,
    );
    root.style.setProperty(
      '--atlas-duration-normal',
      theme.semantic.motion.duration.normal,
    );
    root.style.setProperty(
      '--atlas-duration-slow',
      theme.semantic.motion.duration.slow,
    );

    root.style.setProperty('--atlas-ease', theme.semantic.motion.easing.ease);
    root.style.setProperty(
      '--atlas-ease-in',
      theme.semantic.motion.easing.easeIn,
    );
    root.style.setProperty(
      '--atlas-ease-out',
      theme.semantic.motion.easing.easeOut,
    );

    root.style.setProperty(
      '--atlas-z-dropdown',
      theme.semantic.zIndex.dropdown,
    );
    root.style.setProperty('--atlas-z-sticky', theme.semantic.zIndex.sticky);
    root.style.setProperty('--atlas-z-fixed', theme.semantic.zIndex.fixed);
    root.style.setProperty('--atlas-z-modal', theme.semantic.zIndex.modal);
    root.style.setProperty('--atlas-z-popover', theme.semantic.zIndex.popover);
    root.style.setProperty('--atlas-z-tooltip', theme.semantic.zIndex.tooltip);
    root.style.setProperty('--atlas-z-toast', theme.semantic.zIndex.toast);
    root.style.setProperty('--atlas-z-overlay', theme.semantic.zIndex.overlay);

    root.style.setProperty('--atlas-color-scheme', theme.type);
    document.body.style.colorScheme = theme.type;
  }

  private applyMaterialTheme(theme: Theme): void {
    const root = document.documentElement;

    root.style.setProperty(
      '--md-sys-color-primary',
      theme.semantic.colors.primary.primary,
    );
    root.style.setProperty(
      '--md-sys-color-tertiary',
      theme.semantic.colors.secondary.primary ||
        theme.semantic.colors.primary.primary,
    );
    root.style.setProperty(
      '--md-sys-color-error',
      theme.semantic.colors.border.error || '#f55e57',
    );
    root.style.setProperty(
      '--md-sys-color-background',
      theme.semantic.colors.background.primary,
    );
    root.style.setProperty(
      '--md-sys-color-surface',
      theme.semantic.colors.surface.primary,
    );
    root.style.setProperty(
      '--md-sys-color-on-surface',
      theme.semantic.colors.text.primary,
    );
  }

  exportThemeAsJSON(): string {
    return JSON.stringify(this.currentTheme, null, 2);
  }
}
