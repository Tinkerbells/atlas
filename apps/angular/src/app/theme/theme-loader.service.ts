import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Theme } from './theme';
import { ElectronService } from '~/core/services';
import { Logger } from '~/logger';

@Injectable({
  providedIn: 'root',
})
export class ThemeLoaderService {
  private http = inject(HttpClient);
  private electronService = inject(ElectronService);
  private logger = inject(Logger);

  loadDefaultTheme(): Observable<Theme> {
    return this.http.get<Theme>('/assets/themes/gemini.json').pipe(
      catchError((error) => {
        this.logger.error('Failed to load default theme', {
          scope: 'ThemeLoaderService',
          payload: { error },
        });
        return of(this.getDefaultTheme());
      }),
    );
  }

  loadThemeFromJSON(filePath: string): Observable<Theme> {
    if (this.electronService.isElectron) {
      try {
        const content = this.electronService.fs.readFileSync(filePath, 'utf-8');
        const theme: Theme = JSON.parse(content);
        return of(theme);
      } catch (error) {
        this.logger.error(`Failed to load theme from ${filePath}`, {
          scope: 'ThemeLoaderService',
          payload: { error },
        });
        return of(this.getDefaultTheme());
      }
    }

    return this.http.get<Theme>(filePath).pipe(
      catchError((error) => {
        this.logger.error(`Failed to load theme from ${filePath}`, {
          scope: 'ThemeLoaderService',
          payload: { error },
        });
        return of(this.getDefaultTheme());
      }),
    );
  }

  saveThemeToJSON(theme: Theme, filePath: string): boolean {
    try {
      const content = JSON.stringify(theme, null, 2);
      this.electronService.fs.writeFileSync(filePath, content, 'utf-8');
      this.logger.info(`Theme saved to ${filePath}`, {
        scope: 'ThemeLoaderService',
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to save theme to ${filePath}`, {
        scope: 'ThemeLoaderService',
        payload: { error },
      });
      return false;
    }
  }

  listAvailableThemes(directory: string): string[] {
    if (!this.electronService.isElectron) {
      return [];
    }

    try {
      const files = this.electronService.fs.readdirSync(directory);
      return files.filter((file: string) => file.endsWith('.json'));
    } catch (error) {
      this.logger.error(`Failed to list themes in ${directory}`, {
        scope: 'ThemeLoaderService',
        payload: { error },
      });
      return [];
    }
  }

  validateTheme(theme: any): boolean {
    return (
      theme &&
      typeof theme.name === 'string' &&
      (theme.type === 'light' || theme.type === 'dark') &&
      Array.isArray(theme.tokens) &&
      theme.semantic &&
      theme.semantic.colors &&
      theme.semantic.spacing &&
      theme.semantic.shape
    );
  }

  private getDefaultTheme(): Theme {
    return {
      name: 'Default Dark',
      type: 'dark',
      version: '1.0',
      tokens: [],
      semantic: {
        colors: {
          background: { primary: '#1e1e1e' },
          surface: { primary: '#252526' },
          text: { primary: '#e3e3e3' },
          border: { primary: '#3e3e42' },
          primary: { primary: '#3b82f6' },
          secondary: { primary: '#6366f1' },
          accent: { primary: '#8b5cf6' },
        },
        spacing: {
          xs: '4px',
          s: '8px',
          m: '12px',
          l: '16px',
          xl: '20px',
          xxl: '24px',
          xxxl: '28px',
        },
        shape: {
          none: '0px',
          small: '4px',
          medium: '8px',
          large: '16px',
          full: '9999px',
        },
        state: {
          hover: 'rgba(255, 255, 255, 0.05)',
          focus: 'rgba(59, 130, 246, 0.1)',
          active: 'rgba(255, 255, 255, 0.1)',
          disabled: 'rgba(255, 255, 255, 0.3)',
        },
        typography: {
          body: {
            large: '1.125rem',
            medium: '1rem',
            small: '0.875rem',
          },
          heading: {
            large: '2.25rem',
            medium: '1.5rem',
            small: '1.25rem',
          },
          fontFamily: {
            base: "'Google Sans Flex', -apple-system, BlinkMacSystemFont, sans-serif",
            heading: "'Google Sans Flex', sans-serif",
            monospace: "'Fira Code', 'Courier New', monospace",
          },
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
          },
          fontWeight: {
            light: '300',
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
          },
          lineHeight: {
            tight: '1.25',
            normal: '1.5',
            relaxed: '1.75',
          },
          letterSpacing: {
            tight: '-0.025em',
            normal: '0',
            wide: '0.025em',
          },
        },
        shadows: {
          xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
          none: 'none',
        },
        elevation: {
          none: '0 0 0 0 rgb(0 0 0 / 0)',
          xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        },
        zIndex: {
          dropdown: '1000',
          sticky: '1020',
          fixed: '1030',
          modal: '1040',
          popover: '1050',
          tooltip: '1060',
          toast: '1070',
          overlay: '1080',
        },
        motion: {
          duration: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms',
          },
          easing: {
            ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
        breakpoints: {
          xs: '375px',
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
        },
      },
    };
  }
}
