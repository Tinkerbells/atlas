import { describe, it, expect } from 'vitest';
import { ScanCodeChord, Keybinding, decodeKeybinding, Chord } from '../keybindings';
import { OperatingSystem } from '~/common/core/platform';

// ============================================
// Test helpers (для тестов)
// ============================================

/**
 * Создает тестовый ScanCodeChord
 */
function createTestScanCodeChord(
  ctrlKey: boolean,
  shiftKey: boolean,
  altKey: boolean,
  metaKey: boolean,
  code: number,
): ScanCodeChord {
  return new ScanCodeChord(ctrlKey, shiftKey, altKey, metaKey, code);
}

/**
 * Тестовые данные для скан-кодов
 */
const TEST_SCAN_CODES = {
  KeyA: 10,
  KeyF: 15,
  KeyK: 20,
  KeyZ: 35,
  Digit1: 36,
};

/**
 * Создает тестовый ключевой модификатор
 */
const TEST_MODIFIERS = {
  CtrlCmd: 2048, // (1 << 11)
  Shift: 1024, // (1 << 10)
  Alt: 512, // (1 << 9)
  WinCtrl: 256, // (1 << 8)
};

// ============================================
// Тесты ScanCodeChord
// ============================================

describe('ScanCodeChord', () => {
  describe('constructor', () => {
    it('should create a chord with modifiers and scan code', () => {
      const chord = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );

      expect(chord.ctrlKey).toBe(true);
      expect(chord.shiftKey).toBe(false);
      expect(chord.altKey).toBe(false);
      expect(chord.metaKey).toBe(false);
      expect(chord.code).toBe(TEST_SCAN_CODES.KeyF);
    });

    it('should create a chord without modifiers', () => {
      const chord = createTestScanCodeChord(
        false,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyA,
      );

      expect(chord.ctrlKey).toBe(false);
      expect(chord.shiftKey).toBe(false);
      expect(chord.altKey).toBe(false);
      expect(chord.metaKey).toBe(false);
    });

    it('should create a chord with all modifiers', () => {
      const chord = createTestScanCodeChord(
        true,
        true,
        true,
        true,
        TEST_SCAN_CODES.KeyZ,
      );

      expect(chord.ctrlKey).toBe(true);
      expect(chord.shiftKey).toBe(true);
      expect(chord.altKey).toBe(true);
      expect(chord.metaKey).toBe(true);
    });
  });

  describe('fromNumber', () => {
    it('should decode simple keybinding (Ctrl+K) on Mac', () => {
      // Ctrl+K = 2048 + 37 = 2085
      const keybinding = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyK;
      const chord = ScanCodeChord.fromNumber(
        keybinding,
        OperatingSystem.Macintosh,
      );

      expect(chord.ctrlKey).toBe(false); // На Mac Ctrl это WinCtrl
      expect(chord.metaKey).toBe(true); // На Mac Meta это CtrlCmd
      expect(chord.code).toBe(TEST_SCAN_CODES.KeyK);
    });

    it('should decode simple keybinding (Ctrl+K) on Windows', () => {
      // Ctrl+K = 2048 + 37 = 2085
      const keybinding = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyK;
      const chord = ScanCodeChord.fromNumber(
        keybinding,
        OperatingSystem.Windows,
      );

      expect(chord.ctrlKey).toBe(true); // На Windows Ctrl это CtrlCmd
      expect(chord.metaKey).toBe(false); // На Windows Meta это WinCtrl
      expect(chord.code).toBe(TEST_SCAN_CODES.KeyK);
    });

    it('should decode keybinding with multiple modifiers (Ctrl+Shift+Alt+F)', () => {
      // Ctrl+Shift+Alt+F = 2048 + 1024 + 512 + 25 = 3609
      const keybinding =
        TEST_MODIFIERS.CtrlCmd |
        TEST_MODIFIERS.Shift |
        TEST_MODIFIERS.Alt |
        TEST_SCAN_CODES.KeyF;
      const chord = ScanCodeChord.fromNumber(
        keybinding,
        OperatingSystem.Windows,
      );

      expect(chord.ctrlKey).toBe(true);
      expect(chord.shiftKey).toBe(true);
      expect(chord.altKey).toBe(true);
      expect(chord.code).toBe(TEST_SCAN_CODES.KeyF);
    });

    it('should handle Mac-specific Ctrl/Meta mapping', () => {
      // Ctrl+K на Mac это Meta+K (2048 | 37)
      const keybinding = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyK;
      const chord = ScanCodeChord.fromNumber(
        keybinding,
        OperatingSystem.Macintosh,
      );

      expect(chord.ctrlKey).toBe(false); // Ctrl флаг не установлен
      expect(chord.metaKey).toBe(true); // Meta флаг установлен
    });

    it('should handle Windows-specific Ctrl/Meta mapping', () => {
      // Win+K на Windows это Meta+K (256 | 37)
      const keybinding = TEST_MODIFIERS.WinCtrl | TEST_SCAN_CODES.KeyK;
      const chord = ScanCodeChord.fromNumber(
        keybinding,
        OperatingSystem.Windows,
      );

      expect(chord.ctrlKey).toBe(false); // Ctrl флаг не установлен
      expect(chord.metaKey).toBe(true); // Meta флаг установлен
    });

    it('should handle keybinding = 0', () => {
      const chord = ScanCodeChord.fromNumber(0, OperatingSystem.Windows);

      expect(chord.ctrlKey).toBe(false);
      expect(chord.shiftKey).toBe(false);
      expect(chord.altKey).toBe(false);
      expect(chord.metaKey).toBe(false);
      expect(chord.code).toBe(0);
    });

    it('should handle scan code overflow (bits 8-15 ignored)', () => {
      // Биты 8-15 используются для модификаторов, только биты 0-7 для scan code
      const keybinding = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF;
      const chord = ScanCodeChord.fromNumber(
        keybinding,
        OperatingSystem.Windows,
      );

      expect(chord.code).toBe(TEST_SCAN_CODES.KeyF);
    });
  });

  describe('toNumber', () => {
    it('should encode simple chord to number', () => {
      const chord = createTestScanCodeChord(
        false,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );

      const number = chord.toNumber(OperatingSystem.Windows);
      expect(number).toBe(TEST_SCAN_CODES.KeyF);
    });

    it('should encode chord with modifiers correctly', () => {
      const chord = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );

      const number = chord.toNumber(OperatingSystem.Windows);
      expect(number).toBe(TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF);
    });

    it('should respect Mac-specific Ctrl/Meta mapping', () => {
      const chord = createTestScanCodeChord(
        false,
        false,
        false,
        true,
        TEST_SCAN_CODES.KeyF,
      );

      const number = chord.toNumber(OperatingSystem.Macintosh);
      expect(number).toBe(TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF);
    });

    it('should respect Windows-specific Ctrl/Meta mapping', () => {
      const chord = createTestScanCodeChord(
        false,
        false,
        false,
        true,
        TEST_SCAN_CODES.KeyF,
      );

      const number = chord.toNumber(OperatingSystem.Windows);
      expect(number).toBe(TEST_MODIFIERS.WinCtrl | TEST_SCAN_CODES.KeyF);
    });
  });

  describe('equals', () => {
    it('should return true for identical chords', () => {
      const chord1 = createTestScanCodeChord(
        true,
        false,
        true,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const chord2 = createTestScanCodeChord(
        true,
        false,
        true,
        false,
        TEST_SCAN_CODES.KeyF,
      );

      expect(chord1.equals(chord2)).toBe(true);
    });

    it('should return false for different chords', () => {
      const chord1 = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const chord2 = createTestScanCodeChord(
        false,
        true,
        false,
        false,
        TEST_SCAN_CODES.KeyA,
      );

      expect(chord1.equals(chord2)).toBe(false);
    });

    it('should return false for chords with different modifiers', () => {
      const chord1 = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const chord2 = createTestScanCodeChord(
        false,
        true,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );

      expect(chord1.equals(chord2)).toBe(false);
    });

    it('should return false for chords with different scan codes', () => {
      const chord1 = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const chord2 = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyA,
      );

      expect(chord1.equals(chord2)).toBe(false);
    });
  });

  describe('roundtrip - encode/decode cycle', () => {
    it('should preserve chord data through encode/decode cycle', () => {
      const original = createTestScanCodeChord(
        true,
        true,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );

      const encoded = original.toNumber(OperatingSystem.Windows);
      const decoded = ScanCodeChord.fromNumber(
        encoded,
        OperatingSystem.Windows,
      );

      expect(decoded.equals(original)).toBe(true);
    });

    it('should handle complex modifiers roundtrip', () => {
      const original = createTestScanCodeChord(
        true,
        true,
        true,
        true,
        TEST_SCAN_CODES.KeyZ,
      );

      const encoded = original.toNumber(OperatingSystem.Windows);
      const decoded = ScanCodeChord.fromNumber(
        encoded,
        OperatingSystem.Windows,
      );

      expect(decoded.equals(original)).toBe(true);
    });

    it('should preserve data across different OS encoding', () => {
      const original = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );

      // Encode на Mac
      const macEncoded = original.toNumber(OperatingSystem.Macintosh);
      const macDecoded = ScanCodeChord.fromNumber(
        macEncoded,
        OperatingSystem.Macintosh,
      );

      // Encode на Windows
      const windowsEncoded = original.toNumber(OperatingSystem.Windows);
      const windowsDecoded = ScanCodeChord.fromNumber(
        windowsEncoded,
        OperatingSystem.Windows,
      );

      expect(macDecoded.equals(original)).toBe(true);
      expect(windowsDecoded.equals(original)).toBe(true);
    });
  });
});

// ============================================
// Тесты Keybinding
// ============================================

describe('Keybinding', () => {
  describe('constructor', () => {
    it('should create keybinding with single chord', () => {
      const chord = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const keybinding = new Keybinding([chord]);

      expect(keybinding.chords).toHaveLength(1);
      expect(keybinding.chords[0]).toEqual(chord);
    });

    it('should create keybinding with multiple chords', () => {
      const chord1 = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyK,
      );
      const chord2 = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const keybinding = new Keybinding([chord1, chord2]);

      expect(keybinding.chords).toHaveLength(2);
      expect(keybinding.chords[0]).toEqual(chord1);
      expect(keybinding.chords[1]).toEqual(chord2);
    });

    it('should throw error for empty chords array', () => {
      expect(() => new Keybinding([])).toThrow(
        'Keybinding must contain at least one chord.',
      );
    });

    it('should throw error for undefined chords array', () => {
      expect(() => new Keybinding(undefined as unknown as Chord[])).toThrow(
        'Keybinding must contain at least one chord.',
      );
    });
  });

  describe('fromNumber', () => {
    it('should decode single-chord keybinding', () => {
      const number = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF;
      const keybinding = Keybinding.fromNumber(number, OperatingSystem.Windows);

      expect(keybinding).not.toBeNull();
      expect(keybinding!.chords).toHaveLength(1);
      expect(keybinding!.chords[0].ctrlKey).toBe(true);
      expect(keybinding!.chords[0].code).toBe(TEST_SCAN_CODES.KeyF);
    });

    it('should decode two-chord keybinding', () => {
      // Ctrl+K Ctrl+F
      const chord1 = TEST_MODIFIERS.CtrlCmd | 37; // KeyK
      const chord2 = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF;
      const number = chord1 | (chord2 << 16);

      const keybinding = Keybinding.fromNumber(number, OperatingSystem.Windows);

      expect(keybinding).not.toBeNull();
      expect(keybinding!.chords).toHaveLength(2);
      expect(keybinding!.chords[0].code).toBe(37);
      expect(keybinding!.chords[1].code).toBe(TEST_SCAN_CODES.KeyF);
    });

    it('should return null for keybinding = 0', () => {
      const keybinding = Keybinding.fromNumber(0, OperatingSystem.Windows);
      expect(keybinding).toBeNull();
    });

    it('should correctly split 32-bit number into two 16-bit chords', () => {
      const chord1 = ScanCodeChord.fromNumber(
        TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyK,
        OperatingSystem.Windows,
      );
      const chord2 = ScanCodeChord.fromNumber(
        TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF,
        OperatingSystem.Windows,
      );
      const number = chord1.toNumber(OperatingSystem.Windows) |
        (chord2.toNumber(OperatingSystem.Windows) << 16);

      const keybinding = Keybinding.fromNumber(number, OperatingSystem.Windows);

      expect(keybinding).not.toBeNull();
      expect(keybinding!.chords).toHaveLength(2);
      expect(keybinding!.chords[0].toNumber(OperatingSystem.Windows)).toBe(
        chord1.toNumber(OperatingSystem.Windows),
      );
      expect(keybinding!.chords[1].toNumber(OperatingSystem.Windows)).toBe(
        chord2.toNumber(OperatingSystem.Windows),
      );
    });
  });

  describe('toNumber', () => {
    it('should encode single-chord keybinding', () => {
      const chord = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const keybinding = new Keybinding([chord]);

      const number = keybinding.toNumber(OperatingSystem.Windows);
      const expected = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF;

      expect(number).toBe(expected);
    });

    it('should encode two-chord keybinding', () => {
      const chord1 = createTestScanCodeChord(true, false, false, false, 37);
      const chord2 = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const keybinding = new Keybinding([chord1, chord2]);

      const number = keybinding.toNumber(OperatingSystem.Windows);
      const expected =
        TEST_MODIFIERS.CtrlCmd |
        37 |
        ((TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF) << 16);

      expect(number).toBe(expected);
    });

    it('should correctly combine two 16-bit chords into 32-bit number', () => {
      const chord1 = ScanCodeChord.fromNumber(
        TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyK,
        OperatingSystem.Windows,
      );
      const chord2 = ScanCodeChord.fromNumber(
        TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF,
        OperatingSystem.Windows,
      );
      const keybinding = new Keybinding([chord1, chord2]);

      const number = keybinding.toNumber(OperatingSystem.Windows);
      const expected = chord1.toNumber(OperatingSystem.Windows) |
        ((chord2.toNumber(OperatingSystem.Windows) & 0xFFFF) << 16);

      expect(number).toBe(expected);
    });
  });

  describe('hasMultipleChords', () => {
    it('should return true for multi-chord keybinding', () => {
      const chord1 = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyK,
      );
      const chord2 = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const keybinding = new Keybinding([chord1, chord2]);

      expect(keybinding.hasMultipleChords()).toBe(true);
    });

    it('should return false for single-chord keybinding', () => {
      const chord = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const keybinding = new Keybinding([chord]);

      expect(keybinding.hasMultipleChords()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for identical keybindings', () => {
      const chord = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const kb1 = new Keybinding([chord]);
      const kb2 = new Keybinding([chord]);

      expect(kb1.equals(kb2)).toBe(true);
    });

    it('should return false for different keybindings', () => {
      const chord1 = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const chord2 = createTestScanCodeChord(
        false,
        true,
        false,
        false,
        TEST_SCAN_CODES.KeyA,
      );
      const kb1 = new Keybinding([chord1]);
      const kb2 = new Keybinding([chord2]);

      expect(kb1.equals(kb2)).toBe(false);
    });

    it('should return false for keybindings with different chord count', () => {
      const chord = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const kb1 = new Keybinding([chord]);
      const kb2 = new Keybinding([chord, chord]);

      expect(kb1.equals(kb2)).toBe(false);
    });

    it('should return false when comparing to null', () => {
      const chord = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const kb = new Keybinding([chord]);

      expect(kb.equals(null)).toBe(false);
    });

    it('should return false when comparing to undefined', () => {
      const chord = createTestScanCodeChord(
        true,
        false,
        false,
        false,
        TEST_SCAN_CODES.KeyF,
      );
      const kb = new Keybinding([chord]);

      expect(kb.equals(undefined)).toBe(false);
    });
  });
});

describe('decodeKeybinding', () => {
  it('should decode number keybinding', () => {
    const number = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF;
    const keybinding = decodeKeybinding(number, OperatingSystem.Windows);

    expect(keybinding).not.toBeNull();
    expect(keybinding!.chords).toHaveLength(1);
  });

  it('should decode array of numbers keybinding', () => {
    const chord1Value = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyK;
    const chord2Value = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF;
    const keybinding = decodeKeybinding(
      [chord1Value, chord2Value],
      OperatingSystem.Windows,
    );

    expect(keybinding).not.toBeNull();
    expect(keybinding!.chords).toHaveLength(2);
  });

  it('should return correct number of chords from array', () => {
    const chord1Value = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyK;
    const chord2Value = TEST_MODIFIERS.CtrlCmd | TEST_SCAN_CODES.KeyF;
    const keybinding = decodeKeybinding(
      [chord1Value, chord2Value],
      OperatingSystem.Windows,
    );

    expect(keybinding).not.toBeNull();
    expect(keybinding!.chords).toHaveLength(2);
    expect(keybinding!.chords[0].toNumber(OperatingSystem.Windows)).toBe(
      chord1Value,
    );
    expect(keybinding!.chords[1].toNumber(OperatingSystem.Windows)).toBe(
      chord2Value,
    );
  });
});
