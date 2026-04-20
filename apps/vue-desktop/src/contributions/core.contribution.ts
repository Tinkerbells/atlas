import type { ILogger } from '@/services/logger/logger';
import type { SettingsService } from '@/services/settings/settings.service';
import type { CommandDescriptor } from './contribution-registry';
import { ScanCodeMod } from '@/services/keybindings/keybindings';
import { ScanCode } from '@/services/keybindings/scan-code';

const { CtrlCmd, Shift, Alt } = ScanCodeMod;

export function createCoreContributions(
  logger: ILogger,
  settings: SettingsService,
): CommandDescriptor[] {
  return [
    {
      id: 'app.showInfo',
      handler: () => {
        logger.info('Atlas Vue Desktop — info panel', { scope: 'Core' });
      },
      keybinding: {
        weight: 100,
        when: null,
        primary: CtrlCmd | Shift | ScanCode.KeyI,
      },
    },

    {
      id: 'editor.fontSize.increase',
      handler: () => {
        const current = settings.get('fontSize') ?? 14;
        const next = Math.min(32, current + 1);
        settings.set('fontSize', next);
        logger.info(`Font size: ${next}px`, { scope: 'Editor' });
      },
      keybinding: {
        weight: 100,
        when: null,
        primary: CtrlCmd | Shift | ScanCode.Equal,
      },
    },

    {
      id: 'editor.fontSize.decrease',
      handler: () => {
        const current = settings.get('fontSize') ?? 14;
        const next = Math.max(10, current - 1);
        settings.set('fontSize', next);
        logger.info(`Font size: ${next}px`, { scope: 'Editor' });
      },
      keybinding: {
        weight: 100,
        when: null,
        primary: CtrlCmd | ScanCode.Minus,
      },
    },

    {
      id: 'editor.fontSize.reset',
      handler: () => {
        settings.set('fontSize', 14);
        logger.info('Font size reset to 14px', { scope: 'Editor' });
      },
      keybinding: {
        weight: 100,
        when: null,
        primary: CtrlCmd | ScanCode.Digit0,
      },
    },

    {
      id: 'editor.toggleWordWrap',
      handler: () => {
        const current = settings.get('wordWrap') ?? false;
        settings.set('wordWrap', !current);
        logger.info(`Word wrap: ${!current}`, { scope: 'Editor' });
      },
      keybinding: {
        weight: 100,
        when: null,
        primary: Alt | ScanCode.KeyZ,
      },
    },

    {
      id: 'editor.toggleLineNumbers',
      handler: () => {
        const current = settings.get('lineNumbers') ?? true;
        settings.set('lineNumbers', !current);
        logger.info(`Line numbers: ${!current}`, { scope: 'Editor' });
      },
      keybinding: {
        weight: 100,
        when: null,
        primary: CtrlCmd | Shift | ScanCode.KeyL,
      },
    },

    {
      id: 'app.toggleLogging',
      handler: () => {
        const current = settings.get('logging') ?? true;
        settings.set('logging', !current);
        logger.info(`Logging: ${!current}`, { scope: 'Core' });
      },
      keybinding: {
        weight: 100,
        when: null,
        primary: CtrlCmd | Shift | ScanCode.KeyK,
      },
    },
  ];
}
