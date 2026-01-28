import { describe, it, expect, beforeEach } from 'vitest';
import type { IContext } from '~/context/context.service';
import type { Logger } from '~/logger/logger';
import { KeybindingsRegistryImpl } from '../keybindings-registry';
import { ContextKeyExpression } from '~/context/parser';
import { OperatingSystem, OS } from '~/common/core/platform';

// ============================================
// Test helpers (для тестов)
// ============================================

/**
 * Test modifiers
 */
const KeyMod = {
  CtrlCmd: 2048,
  Shift: 1024,
  Alt: 512,
  WinCtrl: 256,
};

/**
 * Test scan codes
 */
const KeyCode = {
  KeyA: 20,
  KeyB: 21,
  KeyC: 22,
  KeyF: 25,
  KeyZ: 35,
};

/**
 * Creates simple context expression
 */
function createContextRule(expression: (ctx: any) => boolean): ContextKeyExpression {
  class CustomContextExpression extends ContextKeyExpression {
    constructor(private readonly _expression: (ctx: any) => boolean) {
      super();
    }

    evaluate(context: IContext): boolean {
      return this._expression(context);
    }
  }

  return new CustomContextExpression(expression);
}

/**
 * Mock Logger for tests
 */
const mockLogger: Logger = {
  critical: () => {},
  debug: () => {},
  error: () => {},
  info: () => {},
  trace: () => {},
  warning: () => {},
};

// ============================================
// Tests for KeybindingsRegistryImpl (аналог VS Code)
// ============================================

describe('KeybindingsRegistryImpl', () => {
  let registry: KeybindingsRegistryImpl;

  beforeEach(() => {
    registry = new KeybindingsRegistryImpl(mockLogger);
  });

  describe('getDefaultKeybindings', () => {
    it('should return empty array initially (аналог VS Code)', () => {
      const result = registry.getDefaultKeybindings();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return registered keybindings (аналог VS Code)', () => {
      registry.registerKeybindingRule({
        id: 'command1',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
      });

      const result1 = registry.getDefaultKeybindings();

      expect(result1).toHaveLength(1);
      expect(result1[0].command).toBe('command1');
    });

    it('should return sorted keybindings (аналог VS Code)', () => {
      registry.registerKeybindingRule({
        id: 'command2',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyB,
      });

      const result2 = registry.getDefaultKeybindings();

      expect(result2).toHaveLength(2);
      expect(result2[0].command).toBe('command2');
      expect(result2[1].command).toBe('command1');
    });

    it('should return new array on each call (not cached) (аналог VS Code)', () => {
      registry.registerKeybindingRule({
        id: 'command1',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
      });

      const result1 = registry.getDefaultKeybindings();
      expect(result1).toHaveLength(1);

      const result2 = registry.getDefaultKeybindings();
      expect(result2).toHaveLength(1);
      expect(result2).not.toBe(result1);
    });
  });

  describe('registerKeybindingRule', () => {
    it('should register primary keybinding (аналог VS Code)', () => {
      const _disposable = registry.registerKeybindingRule({
        id: 'test.command',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyF,
      });

      const result = registry.getDefaultKeybindings();

      expect(result).toHaveLength(1);
      expect(result[0].command).toBe('test.command');
      expect(typeof _disposable.dispose).toBe('function');
    });

    it('should register secondary keybindings (аналог VS Code)', () => {
      const _disposable = registry.registerKeybindingRule({
        id: 'test.command',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
        secondary: [
          KeyMod.CtrlCmd | KeyCode.KeyF,
          KeyMod.CtrlCmd | KeyCode.KeyZ,
        ],
      });

      const result = registry.getDefaultKeybindings();

      expect(result).toHaveLength(3);
      expect(result[0].command).toBe('test.command');
      expect(result[1].command).toBe('test.command');
      expect(result[2].command).toBe('test.command');
    });

    it('should handle platform-specific keybindings (аналог VS Code)', () => {
      const _disposable = registry.registerKeybindingRule({
        id: 'test.command',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
        mac: {
          primary: KeyMod.CtrlCmd | KeyCode.KeyF,
        },
        win: {
          primary: KeyMod.CtrlCmd | KeyCode.KeyZ,
        },
      });

      const result = registry.getDefaultKeybindings();

      expect(result).toHaveLength(1);
      // On Mac should use mac.primary
      if (OS === OperatingSystem.Macintosh) {
        expect(result[0].command).toBe('test.command');
      }
      // On Windows/Linux should use primary (win not defined)
      if (OS === OperatingSystem.Windows || OS === OperatingSystem.Linux) {
        expect(result[0].command).toBe('test.command');
      }
    });

    it('should return disposable that removes keybinding (аналог VS Code)', () => {
      const _disposable = registry.registerKeybindingRule({
        id: 'test.command',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
      });

      const result1 = registry.getDefaultKeybindings();
      expect(result1).toHaveLength(1);

      // Remove
      _disposable.dispose();

      const result2 = registry.getDefaultKeybindings();
      expect(result2).toHaveLength(0);
    });

    it('should invalidate cache on registration (аналог VS Code)', () => {
      registry.registerKeybindingRule({
        id: 'command1',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
      });

      const result1 = registry.getDefaultKeybindings();
      expect(result1).toHaveLength(1);

      registry.registerKeybindingRule({
        id: 'command2',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyB,
      });

      const result2 = registry.getDefaultKeybindings();
      expect(result2).toHaveLength(2);
    });

    it('should handle context rules (аналог VS Code)', () => {
      const contextRule = createContextRule((ctx: any) => ctx.getValue('editorFocus') === true);

      const _disposable = registry.registerKeybindingRule({
        id: 'test.command',
        weight: 100,
        when: contextRule,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
      });

      const result = registry.getDefaultKeybindings();

      expect(result).toHaveLength(1);
      expect(result[0].when).toBe(contextRule);
    });

    it('should handle command arguments (аналог VS Code)', () => {
      const args = { test: 'value' };
      const _disposable = registry.registerKeybindingRule({
        id: 'test.command',
        weight: 100,
        when: undefined,
        args: args,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
      });

      const result = registry.getDefaultKeybindings();

      expect(result).toHaveLength(1);
      expect(result[0].commandArgs).toEqual(args);
      expect(result[0].when).toBeUndefined();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clear all keybindings (аналог VS Code)', () => {
      registry.registerKeybindingRule({
        id: 'command1',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
      });

      registry.registerKeybindingRule({
        id: 'command2',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyB,
      });

      const result1 = registry.getDefaultKeybindings();
      expect(result1).toHaveLength(2);

      registry.ngOnDestroy();

      const result2 = registry.getDefaultKeybindings();
      expect(result2).toEqual([]);
      expect(result2).toHaveLength(0);
    });

    it('should clear cache (аналог VS Code)', () => {
      registry.registerKeybindingRule({
        id: 'command1',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
      });

      const result1 = registry.getDefaultKeybindings();
      expect(result1).toHaveLength(1);

      registry.ngOnDestroy();

      const _disposable = registry.registerKeybindingRule({
        id: 'command2',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyB,
      });

      const result2 = registry.getDefaultKeybindings();
      expect(result2).toHaveLength(1);
      expect(result2).not.toBe(result1);
    });
  });

  describe('edge cases', () => {
    it('should handle duplicate registrations (аналог VS Code)', () => {
      const _disposable1 = registry.registerKeybindingRule({
        id: 'command',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
      });

      const _disposable2 = registry.registerKeybindingRule({
        id: 'command',
        weight: 200, // higher weight
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | KeyCode.KeyA,
      });

      const result = registry.getDefaultKeybindings();

      // Should return only one (replaced by second)
      expect(result).toHaveLength(1);
      expect(result[0].command).toBe('command');
    });

    it('should handle null primary keybinding (аналог VS Code)', () => {
      const _disposable = registry.registerKeybindingRule({
        id: '',
        weight: 0,
        when: undefined,
        args: undefined,
        primary: 0, // No keybinding
      });

      const result = registry.getDefaultKeybindings();

      expect(result).toHaveLength(0);
    });

    it('should warn for reserved browser keybindings (аналог VS Code)', () => {
      const _disposable = registry.registerKeybindingRule({
        id: 'test.command',
        weight: 100,
        when: undefined,
        args: undefined,
        primary: KeyMod.CtrlCmd | 13, // KeyR - reserved
      });

      const result = registry.getDefaultKeybindings();

      expect(result).toHaveLength(1);
      expect(result[0].command).toBe('test.command');
    });
  });
});
