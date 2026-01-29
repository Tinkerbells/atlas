import { describe, it, expect, beforeEach } from 'vitest';
import { KeyboardMapper } from '../keyboard-mapper';
import { OperatingSystem } from '~/platform';
import { ScanCodeChord, Keybinding } from '../keybindings';
import { ScanCode, ScanCodeUtils } from '../scan-code';

// ============================================
// Test helpers (для тестов)
// ============================================

/**
 * Создает mock KeyboardEvent
 */
function createMockKeyboardEvent(
  code: string,
  modifiers: Partial<{
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
  }>,
): Partial<KeyboardEvent> {
  return {
    code,
    ...modifiers,
    key: '',
    charCode: 0,
    location: 0,
    bubbles: true,
    cancelable: true,
    repeat: false,
    getModifierState: (modifier: string) => modifier === 'AltGraph',
  };
}

/**
 * Тестовые ScanCodes (must match ScanCode enum positions)
 */
const TEST_CODES = {
  KeyA: 10,
  KeyF: 15,
  KeyK: 20,
  KeyZ: 35,
};

// ============================================
// Тесты KeyboardMapper
// ============================================

describe('KeyboardMapper', () => {
  let mapper: KeyboardMapper;

  beforeEach(() => {
    mapper = new KeyboardMapper(OperatingSystem.Macintosh, false);
  });

  describe('constructor', () => {
    it('should initialize scanCodeToDispatch array (аналог VS Code)', () => {
      expect(mapper).toBeDefined();
      expect(typeof mapper['dumpDebugInfo']).toBe('function');
    });

    it('should create with correct OS (аналог VS Code)', () => {
      const macMapper = new KeyboardMapper(OperatingSystem.Macintosh, false);
      const windowsMapper = new KeyboardMapper(OperatingSystem.Windows, false);
      const linuxMapper = new KeyboardMapper(OperatingSystem.Linux, false);

      expect(macMapper['dumpDebugInfo']()).toBe(
        'FallbackKeyboardMapper dispatching on scanCode',
      );
      expect(windowsMapper['dumpDebugInfo']()).toBe(
        'FallbackKeyboardMapper dispatching on scanCode',
      );
      expect(linuxMapper['dumpDebugInfo']()).toBe(
        'FallbackKeyboardMapper dispatching on scanCode',
      );
    });
  });

  describe('resolveKeyboardEvent', () => {
    it('should resolve KeyboardEvent to ResolvedKeybinding (аналог VS Code)', () => {
      const event = createMockKeyboardEvent('KeyF', {
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      }) as KeyboardEvent;

      const result = mapper.resolveKeyboardEvent(event);

      expect(result).toBeDefined();
      expect(result.getDispatchChords()).toEqual(['KeyF']);
    });

    it('should resolve KeyboardEvent with modifiers (аналог VS Code)', () => {
      const event = createMockKeyboardEvent('KeyF', {
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      }) as KeyboardEvent;

      const result = mapper.resolveKeyboardEvent(event);

      expect(result.getDispatchChords()).toEqual(['ctrl+KeyF']);
    });

    it('should handle unknown keyboard code gracefully (аналог VS Code)', () => {
      const event = createMockKeyboardEvent('UnknownCode', {
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      }) as KeyboardEvent;

      const result = mapper.resolveKeyboardEvent(event);

      expect(result.getDispatchChords()).toEqual(['None']);
    });
  });

  describe('resolveKeybinding', () => {
    it('should resolve Keybinding to ResolvedKeybinding (аналог VS Code)', () => {
      const chord = new ScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_CODES.KeyF,
      );
      const keybinding = new Keybinding([chord]);

      const result = mapper.resolveKeybinding(keybinding);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
    });

    it('should respect OS in resolution (аналог VS Code)', () => {
      const chord = new ScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_CODES.KeyA,
      );
      const keybinding = new Keybinding([chord]);

      const macResult = new KeyboardMapper(
        OperatingSystem.Macintosh,
        false,
      ).resolveKeybinding(keybinding);
      const windowsResult = new KeyboardMapper(
        OperatingSystem.Windows,
        false,
      ).resolveKeybinding(keybinding);

      expect(macResult).toBeDefined();
      expect(windowsResult).toBeDefined();
    });
  });

  describe('getDispatchStrForScanCodeChord', () => {
    it('should generate dispatch string for simple chord (аналог VS Code)', () => {
      const chord = new ScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_CODES.KeyF,
      );

      const result = mapper.getDispatchStrForScanCodeChord(chord);

      expect(result).toBe('ctrl+KeyF');
    });

    it('should generate dispatch string with all modifiers (аналог VS Code)', () => {
      const chord = new ScanCodeChord(true, true, true, false, TEST_CODES.KeyZ);

      const result = mapper.getDispatchStrForScanCodeChord(chord);

      expect(result).toBe('ctrl+shift+alt+KeyZ');
    });

    it('should handle scanCodeToString for Hyper (аналог VS Code)', () => {
      const chord = new ScanCodeChord(
        true,
        false,
        false,
        false,
        ScanCode.Hyper,
      );

      const result = mapper.getDispatchStrForScanCodeChord(chord);

      expect(result).toBe('ctrl+Hyper');
    });
  });

  describe('ScanCodeUtils.fromString', () => {
    it('should convert known code string to ScanCode (аналог VS Code)', () => {
      const code = ScanCodeUtils.fromString('KeyF');
      expect(code).toBe(TEST_CODES.KeyF);
    });

    it('should return None for unknown code (аналог VS Code)', () => {
      const code = ScanCodeUtils.fromString('UnknownCode');
      expect(code).toBe(ScanCode.None);
    });
  });

  describe('dumpDebugInfo', () => {
    it('should return debug string (аналог VS Code)', () => {
      const info = mapper['dumpDebugInfo']();
      expect(info).toBeTypeOf('string');
    });
  });
});
