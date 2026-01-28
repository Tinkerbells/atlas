import { describe, it, expect } from 'vitest';
import { isReservedBrowserKeybinding, RESERVED_BROWSER_KEYBINDINGS } from '../reserved-keybindings';

// ============================================
// Test helpers for tests (аналог VS Code)
// ============================================

/**
 * Test modifiers
 */
const _KeyMod = {
  CtrlCmd: 2048,
  Shift: 1024,
  Alt: 512,
  WinCtrl: 256,
};

// ============================================
// Tests for Reserved Browser Keybindings (аналог VS Code)
// ============================================

describe('Reserved Browser Keybindings', () => {
  describe('isReservedBrowserKeybinding', () => {
    it('should identify Ctrl+R as reserved', () => {
      expect(isReservedBrowserKeybinding('ctrl+r')).toBe(true);
    });

    it('should identify Ctrl+T as reserved', () => {
      expect(isReservedBrowserKeybinding('ctrl+t')).toBe(true);
    });

    it('should identify Ctrl+W as reserved', () => {
      expect(isReservedBrowserKeybinding('ctrl+w')).toBe(true);
    });

    it('should identify Ctrl+L as reserved', () => {
      expect(isReservedBrowserKeybinding('ctrl+l')).toBe(true);
    });

    it('should identify Ctrl+D as reserved', () => {
      expect(isReservedBrowserKeybinding('ctrl+d')).toBe(true);
    });

    it('should identify Ctrl+F as reserved (аналог VS Code)', () => {
      expect(isReservedBrowserKeybinding('ctrl+f')).toBe(true);
    });

    it('should identify Ctrl+G as reserved', () => {
      expect(isReservedBrowserKeybinding('ctrl+g')).toBe(true);
    });

    it('should identify Ctrl+Shift+R as reserved', () => {
      expect(isReservedBrowserKeybinding('ctrl+shift+r')).toBe(true);
    });

    it('should identify Ctrl+Shift+T as reserved', () => {
      expect(isReservedBrowserKeybinding('ctrl+shift+t')).toBe(true);
    });

    it('should NOT identify custom keybindings', () => {
      expect(isReservedBrowserKeybinding('ctrl+custom')).toBe(false);
      expect(isReservedBrowserKeybinding('alt+shift+z')).toBe(false);
      expect(isReservedBrowserKeybinding('cmd+custom')).toBe(false);
      expect(isReservedBrowserKeybinding('meta+shift+f')).toBe(false);
    });

    it('should be case-insensitive (аналог VS Code)', () => {
      expect(isReservedBrowserKeybinding('CTRL+R')).toBe(true);
      expect(isReservedBrowserKeybinding('Ctrl+r')).toBe(true);
      expect(isReservedBrowserKeybinding('CTRL+R')).toBe(true);
    });

    it('should handle modifier order variations', () => {
      expect(isReservedBrowserKeybinding('shift+ctrl+r')).toBe(true);
      expect(isReservedBrowserKeybinding('ctrl+shift+r')).toBe(true);
      expect(isReservedBrowserKeybinding('alt+ctrl+r')).toBe(true);
    });
  });

  describe('RESERVED_BROWSER_KEYBINDINGS list', () => {
    it('should contain common browser shortcuts', () => {
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+r');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+t');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+w');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+l');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+d');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+f');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+g');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+shift+r');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+shift+t');
    });

    it('should contain Mac-specific shortcuts', () => {
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('cmd+r');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('cmd+t');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('cmd+w');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('cmd+l');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('cmd+d');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('cmd+f');
    });

    it('should contain Windows-specific shortcuts', () => {
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+r');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+t');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+w');
      expect(RESERVED_BROWSER_KEYBINDINGS).toContain('ctrl+l');
    });
  });

  describe('edge cases', () => {
    it('should not contain duplicates', () => {
      const uniqueBindings = Array.from(new Set(RESERVED_BROWSER_KEYBINDINGS));
      expect(uniqueBindings).toHaveLength(RESERVED_BROWSER_KEYBINDINGS.length);
    });
  });
});
