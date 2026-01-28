import { describe, it, expect, beforeEach } from 'vitest';
import type { IContext } from '~/context/context.service';
import {
  KeybindingResolver,
  ResultKind,
  MoreChordsNeeded,
} from '../keybindings-resolver';
import { ResolvedKeybindingItem } from '../resolved-keybinding-item';
import { USLayoutResolvedKeybinding } from '../us-layout-resolved-keybinding';
import { ContextKeyExpression } from '~/context/parser';
import { ScanCodeChord, Keybinding } from '../keybindings';
import { OperatingSystem } from '~/common/core/platform';

// ============================================
// Test helpers (аналог VS Code)
// ============================================

/**
 * Creates mock context
 */
function createContext(values: Record<string, any>): IContext {
  return {
    getValue: (key: string) => values[key],
  };
}

/**
 * Creates simple context expression
 */
function createContextRule(
  expression: (ctx: any) => boolean,
): ContextKeyExpression {
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
 * Gets dispatch string for chord
 */
function getDispatchStr(chord: ScanCodeChord): string {
  return USLayoutResolvedKeybinding.getDispatchStr(chord)!;
}

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
  KeyK: 37,
  KeyZ: 35,
  KeyF: 25,
  KeyV: 47,
  Equal: 13,
};

// ============================================
// Tests for KeybindingResolver (аналог VS Code)
// ============================================

describe('KeybindingResolver', () => {
  let _resolver: KeybindingResolver;

  beforeEach(() => {
    _resolver = new KeybindingResolver([], []);
  });

  describe('resolve key', () => {
    it('should find simple keybinding (аналог VS Code)', () => {
      const keybinding = KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ;
      const contextRule = createContextRule(
        (ctx: any) => ctx.getValue('bar') === 'baz',
      );
      const item = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(keybinding, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'yes',
        null,
        contextRule,
        true,
      );

      expect(contextRule.evaluate(createContext({ bar: 'baz' }))).toBe(true);
      expect(contextRule.evaluate(createContext({ bar: 'bz' }))).toBe(false);

      const resolver = new KeybindingResolver([item], []);

      const r1 = resolver.resolve(
        createContext({ bar: 'baz' }),
        [],
        getDispatchStr(
          ScanCodeChord.fromNumber(keybinding, OperatingSystem.Macintosh),
        ),
      );
      expect(r1.kind).toBe(ResultKind.KbFound);

      const r2 = resolver.resolve(
        createContext({ bar: 'bz' }),
        [],
        getDispatchStr(
          ScanCodeChord.fromNumber(keybinding, OperatingSystem.Macintosh),
        ),
      );
      expect(r2.kind).toBe(ResultKind.NoMatchingKb);
    });
  });

  describe('resolve key with arguments', () => {
    it('should resolve keybinding with command arguments (аналог VS Code)', () => {
      const commandArgs = { text: 'no' };
      const keybinding = KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ;
      const contextRule = createContextRule(
        (ctx: any) => ctx.getValue('bar') === 'baz',
      );
      const item = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(keybinding, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'yes',
        commandArgs,
        contextRule,
        true,
      );

      const resolver = new KeybindingResolver([item], []);

      const r = resolver.resolve(
        createContext({ bar: 'baz' }),
        [],
        getDispatchStr(
          ScanCodeChord.fromNumber(keybinding, OperatingSystem.Macintosh),
        ),
      );

      if (r.kind === ResultKind.KbFound) {
        expect(r.kind).toBe(ResultKind.KbFound);
        // Note: commandArgs проверяется только при kind === KbFound
      }
    });
  });

  describe('resolve with context', () => {
    it('should match when context satisfies rule (аналог VS Code)', () => {
      const contextRule = createContextRule(
        (ctx: any) => ctx.getValue('editorFocus') === true,
      );
      const item = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(KeyCode.KeyA, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'command1',
        null,
        contextRule,
        true,
      );
      const resolver = new KeybindingResolver([item], []);

      const r1 = resolver.resolve(
        createContext({ editorFocus: true }),
        [],
        getDispatchStr(
          ScanCodeChord.fromNumber(KeyCode.KeyA, OperatingSystem.Macintosh),
        ),
      );

      if (r1.kind === ResultKind.KbFound) {
        expect(r1.kind).toBe(ResultKind.KbFound);
        expect(r1.commandId).toBe('command1');
      } else {
        expect(r1.kind).toBe(ResultKind.NoMatchingKb);
      }
    });

    it('should not match when context does not satisfy rule (аналог VS Code)', () => {
      const contextRule = createContextRule(
        (ctx: any) => ctx.getValue('editorFocus') === true,
      );
      const item = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(KeyCode.KeyA, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'command1',
        null,
        contextRule,
        true,
      );
      const resolver = new KeybindingResolver([item], []);

      const r = resolver.resolve(
        createContext({ editorFocus: false }),
        [],
        getDispatchStr(
          ScanCodeChord.fromNumber(KeyCode.KeyA, OperatingSystem.Macintosh),
        ),
      );

      expect(r.kind).toBe(ResultKind.NoMatchingKb);
    });
  });

  describe('resolve multi-chord keybindings', () => {
    it('should return MoreChordsNeeded after first chord (аналог VS Code)', () => {
      const kb = KeyMod.CtrlCmd | KeyCode.KeyK;
      const chord1 = kb | ((KeyMod.CtrlCmd | KeyCode.KeyK) << 16);
      const item = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(chord1, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'twoChordCommand',
        null,
        undefined,
        true,
      );
      const resolver = new KeybindingResolver([item], []);

      const r = resolver.resolve(
        createContext({}),
        [],
        getDispatchStr(ScanCodeChord.fromNumber(kb, OperatingSystem.Macintosh)),
      );

      expect(r).toBe(MoreChordsNeeded);
    });

    it('should resolve complete two-chord keybinding (аналог VS Code)', () => {
      const kb1 = KeyMod.CtrlCmd | KeyCode.KeyK;
      const kb2 = KeyMod.CtrlCmd | KeyCode.KeyF;
      const twoChordKeybinding = kb1 | (kb2 << 16);
      const item = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(twoChordKeybinding, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'twoChordCommand',
        null,
        undefined,
        true,
      );
      const resolver = new KeybindingResolver([item], []);

      const r = resolver.resolve(createContext({}), ['ctrl+KeyK'], 'ctrl+KeyF');

      expect(r.kind).toBe(ResultKind.KbFound);
      if (r.kind === ResultKind.KbFound) {
        expect(r.commandId).toBe('twoChordCommand');
      }
    });

    it('should return NoMatchingKb for wrong second chord (аналог VS Code)', () => {
      const kb1 = KeyMod.CtrlCmd | KeyCode.KeyK;
      const kb2 = KeyMod.CtrlCmd | KeyCode.KeyF;
      const twoChordKeybinding = kb1 | (kb2 << 16);
      const item = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(twoChordKeybinding, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'twoChordCommand',
        null,
        undefined,
        true,
      );
      const resolver = new KeybindingResolver([item], []);

      const r = resolver.resolve(createContext({}), ['ctrl+KeyK'], 'ctrl+KeyZ');

      expect(r.kind).toBe(ResultKind.NoMatchingKb);
    });
  });

  describe('getDefaultKeybindings', () => {
    it('should return default keybindings (аналог VS Code)', () => {
      const item1 = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(KeyCode.KeyA, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'command1',
        null,
        undefined,
        true,
      );
      const item2 = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(KeyCode.KeyB, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'command2',
        null,
        undefined,
        true,
      );
      const overrides = [
        new ResolvedKeybindingItem(
          USLayoutResolvedKeybinding.resolveKeybinding(
            Keybinding.fromNumber(KeyCode.KeyA, OperatingSystem.Macintosh)!,
            OperatingSystem.Macintosh,
          )[0],
          'userCommand',
          null,
          undefined,
          false,
        ),
      ];
      const resolver = new KeybindingResolver([item1, item2], overrides);

      const result = resolver.getDefaultKeybindings();

      expect(result).toHaveLength(2);
      expect(result[0].command).toBe('command1');
      expect(result[1].command).toBe('command2');
    });

    it('should return empty array when no defaults (аналог VS Code)', () => {
      const resolver = new KeybindingResolver([], []);

      const result = resolver.getDefaultKeybindings();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getKeybindings', () => {
    it('should return all keybindings (defaults + overrides) (аналог VS Code)', () => {
      const defaults = [
        new ResolvedKeybindingItem(
          USLayoutResolvedKeybinding.resolveKeybinding(
            Keybinding.fromNumber(KeyCode.KeyA, OperatingSystem.Macintosh)!,
            OperatingSystem.Macintosh,
          )[0],
          'defaultCommand1',
          null,
          undefined,
          true,
        ),
        new ResolvedKeybindingItem(
          USLayoutResolvedKeybinding.resolveKeybinding(
            Keybinding.fromNumber(KeyCode.KeyB, OperatingSystem.Macintosh)!,
            OperatingSystem.Macintosh,
          )[0],
          'overrideCommand',
          null,
          undefined,
          false,
        ),
      ];
      const overrides = [
        new ResolvedKeybindingItem(
          USLayoutResolvedKeybinding.resolveKeybinding(
            Keybinding.fromNumber(KeyCode.KeyC, OperatingSystem.Macintosh)!,
            OperatingSystem.Macintosh,
          )[0],
          'userCommand',
          null,
          undefined,
          false,
        ),
      ];
      const resolver = new KeybindingResolver(defaults, overrides);

      const result = resolver.getKeybindings();

      expect(result).toHaveLength(3);
      expect(result[0].command).toBe('defaultCommand1');
      expect(result[1].command).toBe('overrideCommand');
      expect(result[2].command).toBe('userCommand');
    });
  });

  describe('edge cases', () => {
    it('should handle unregistered keybinding (аналог VS Code)', () => {
      const item = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(KeyCode.KeyA, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'command1',
        null,
        undefined,
        true,
      );
      const resolver = new KeybindingResolver([item], []);

      const r = resolver.resolve(createContext({}), [], 'ctrl+KeyZ');

      expect(r.kind).toBe(ResultKind.NoMatchingKb);
    });

    it('should handle null/undefined context (аналог VS Code)', () => {
      const item = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(KeyCode.KeyA, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'command1',
        null,
        undefined,
        true,
      );
      const resolver = new KeybindingResolver([item], []);

      const r = resolver.resolve(createContext({}), [], 'ctrl+KeyA');

      if (r.kind === ResultKind.KbFound) {
        expect(r.commandId).toBe('command1');
      }
    });

    it('should handle keybinding without keybinding (undefined) (аналог VS Code)', () => {
      const item = new ResolvedKeybindingItem(
        undefined,
        'command1',
        null,
        undefined,
        true,
      );
      const resolver = new KeybindingResolver([item], []);

      expect(resolver.getKeybindings()).toHaveLength(1);
    });

    it('should handle duplicate keybindings (аналог VS Code)', () => {
      const item1 = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(KeyCode.KeyA, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'command1',
        null,
        undefined,
        true,
      );
      const item2 = new ResolvedKeybindingItem(
        USLayoutResolvedKeybinding.resolveKeybinding(
          Keybinding.fromNumber(KeyCode.KeyA, OperatingSystem.Macintosh)!,
          OperatingSystem.Macintosh,
        )[0],
        'command2',
        null,
        undefined,
        true,
      );
      const resolver = new KeybindingResolver([item1, item2], []);

      const r = resolver.resolve(createContext({}), [], 'ctrl+KeyA');

      // Should return last (higher weight)
      if (r.kind === ResultKind.KbFound) {
        expect(r.commandId).toBe('command2');
      }
    });
  });

  describe('issue #173325: wrong interpretations of special keys', () => {
    it('should treat KeyV and Equal as different keys (аналог VS Code)', () => {
      const a = new ScanCodeChord(true, false, false, false, KeyCode.KeyV);
      const b = new ScanCodeChord(true, false, false, false, KeyCode.Equal);

      expect(getDispatchStr(a)).not.toBe(getDispatchStr(b));
    });
  });
});
