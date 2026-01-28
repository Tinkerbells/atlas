import { describe, it, expect, beforeEach } from 'vitest';
import { KeyboardMapper } from '../keyboard-mapper';
import { OperatingSystem } from '~/common/core/platform';
import { ScanCodeChord, Keybinding } from '../keybindings';
import { ScanCode, scanCodeFromStr } from '../codes';

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
  };
}

/**
 * Тестовые ScanCodes
 */
const TEST_CODES = {
  KeyA: 20,
  KeyF: 25,
  KeyK: 37,
  KeyZ: 35,
};

// ============================================
// Тесты KeyboardMapper
// ============================================

describe('KeyboardMapper', () => {
  let mapper: KeyboardMapper;

  beforeEach(() => {
    mapper = new KeyboardMapper(OperatingSystem.Macintosh);
  });

  describe('constructor', () => {
    it('should initialize scanCodeToDispatch array (аналог VS Code)', () => {
      expect(mapper).toBeDefined();
      expect(mapper['dumpDebugInfo']()).toBeTypeOf('function');
    });

    it('should create with correct OS (аналог VS Code)', () => {
      const macMapper = new KeyboardMapper(OperatingSystem.Macintosh);
      const windowsMapper = new KeyboardMapper(OperatingSystem.Windows);
      const linuxMapper = new KeyboardMapper(OperatingSystem.Linux);

      expect(macMapper['dumpDebugInfo']()).toBe(
        'FallbackKeyboardMapper dispatching on keyCode',
      );
      expect(windowsMapper['dumpDebugInfo']()).toBe(
        'FallbackKeyboardMapper dispatching on keyCode',
      );
      expect(linuxMapper['dumpDebugInfo']()).toBe(
        'FallbackKeyboardMapper dispatching on keyCode',
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

      expect(result.getDispatchChords()).toEqual([null]);
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
      ).resolveKeybinding(keybinding);
      const windowsResult = new KeyboardMapper(
        OperatingSystem.Windows,
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

    it('should handle null scanCodeToDispatch (аналог VS Code)', () => {
      const chord = new ScanCodeChord(
        true,
        false,
        false,
        false,
        1, // Некорректный scan code
      );

      const result = mapper.getDispatchStrForScanCodeChord(chord);

      expect(result).toBeNull();
    });
  });

  describe('scanCodeFromStr', () => {
    it('should convert known code string to ScanCode (аналог VS Code)', () => {
      const code = scanCodeFromStr('KeyF');
      expect(code).toBe(TEST_CODES.KeyF);
    });

    it('should return None for unknown code (аналог VS Code)', () => {
      const code = scanCodeFromStr('UnknownCode');
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
