import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Theme, DEFAULT_THEME } from './theme';

export const CSS_NAMESPACE = '--atlas'

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentTheme: Theme | null = null;
  private document = inject(DOCUMENT);
  private readonly styleId = `${CSS_NAMESPACE}-id`;

  constructor() { }

  static getDefaultTheme(): Theme {
    return DEFAULT_THEME;
  }

  initializeWithDefault(): void {
    this.setTheme(DEFAULT_THEME);
  }

  /**
   * Sets the active theme and applies CSS variables.
   */
  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.applyCSSVariables(theme);
  }

  /**
   * Updates a single theme variable by name and reapplies styles.
   */
  updateVariable(variableName: string, value: string): void {
    if (this.currentTheme) {
      const token = this.currentTheme.tokens?.find((t) => t.name === variableName);
      if (token) {
        token.value = value;
        this.applyCSSVariables(this.currentTheme);
      }
    }
  }

  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  /**
   * Removes the theme style element from document head.
   */
  private removeThemeStyle() {
    const style = this.document.head.querySelector(`#${this.styleId}`);
    if (style) {
      this.document.head.removeChild(style);
    }
  }

  /**
   * Creates and appends a new style element with theme CSS to document head.
   */
  private insertThemeStyle(content: string) {
    const style = this.document.createElement('style');
    style.id = this.styleId;
    style.innerHTML = content;
    this.document.head.appendChild(style);
  }

  /**
   * Applies all theme CSS variables to :root via style element.
   */
  private applyCSSVariables(theme: Theme): void {
    const lines: string[] = [`:root:root {`];

    theme.tokens?.forEach((token) => {
      lines.push(`  ${token.name}: ${token.value};`);
    });

    lines.push(`  ${CSS_NAMESPACE}-color-scheme: ${theme.type};`);

    const flattenedVariables = this.flattenThemeObject(theme.semantic);

    Object.entries(flattenedVariables).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        lines.push(`  ${CSS_NAMESPACE}-${key}: ${String(value)};`);
      }
    });

    lines.push(`  ${CSS_NAMESPACE}-text-body-large: ${theme.semantic.typography.fontSize.lg}/${theme.semantic.typography.lineHeight.normal};`);
    lines.push(`}`);

    this.removeThemeStyle();
    this.insertThemeStyle(lines.join('\n'));
    this.document.body.style.colorScheme = theme.type;
  }

  /**
   * { spacing: { xs: '4px' } } -> { 'spacing-xs': '4px' }
   */
  private flattenThemeObject(
    obj: Record<string, unknown>,
    prefix = ''
  ): Record<string, string> {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}-${key}` : key;

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const nested = this.flattenThemeObject(
          value as Record<string, unknown>,
          newKey
        );
        Object.assign(acc, nested);
      }
      else if (typeof value === 'string' || typeof value === 'number') {
        acc[newKey] = String(value);
      }
      return acc;
    }, {} as Record<string, string>);
  }

}
