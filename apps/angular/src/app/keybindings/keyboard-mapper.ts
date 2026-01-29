import type { OperatingSystem } from '~/common/core/platform';
import type { ResolvedKeybinding } from './resolved-keybinding';

import { Keybinding, ScanCodeChord } from './keybindings';
import { USLayoutResolvedKeybinding } from './us-layout-resolved-keybinding';
import { ScanCode, ScanCodeUtils } from './scan-code';

export interface IKeyboardMapper {
  dumpDebugInfo: () => string;
  resolveKeyboardEvent: (keyboardEvent: KeyboardEvent) => ResolvedKeybinding;
  resolveKeybinding: (keybinding: Keybinding) => ResolvedKeybinding[];
}

export class KeyboardMapper implements IKeyboardMapper {
  private readonly _scanCodeToDispatch: Array<string | null> = [];
  constructor(
    private readonly _OS: OperatingSystem,
    private readonly _mapAltGrToCtrlAlt: boolean,
  ) {
    // Initialize `_scanCodeToDispatch` with basic US layout mapping
    // This is a simplified version of VS Code's keyboard mapper
    // For full keyboard layout support, would need external mapping files
    for (
      let scanCode = ScanCode.None;
      scanCode < ScanCode.MAX_VALUE;
      scanCode++
    ) {
      this._scanCodeToDispatch[scanCode] = null;
    }

    // Populate _scanCodeToDispatch for common keys
    // Modifiers and navigation keys should not be dispatchable
    const nonDispatchableScanCodes = [
      ScanCode.None,
      ScanCode.ControlLeft,
      ScanCode.ShiftLeft,
      ScanCode.AltLeft,
      ScanCode.MetaLeft,
      ScanCode.ControlRight,
      ScanCode.ShiftRight,
      ScanCode.AltRight,
      ScanCode.MetaRight,
      ScanCode.CapsLock,
      ScanCode.NumLock,
      ScanCode.ScrollLock,
    ];

    for (
      let scanCode = ScanCode.None;
      scanCode < ScanCode.MAX_VALUE;
      scanCode++
    ) {
      if (nonDispatchableScanCodes.includes(scanCode)) {
        continue;
      }
      // Simple dispatch string using ScanCode enum name
      const scanCodeName = ScanCodeUtils.toString(scanCode);
      if (scanCodeName && typeof scanCodeName === 'string') {
        this._scanCodeToDispatch[scanCode] = scanCodeName;
      }
    }
  }

  public dumpDebugInfo(): string {
    return 'FallbackKeyboardMapper dispatching on scanCode';
  }

  public resolveKeyboardEvent(e: KeyboardEvent): ResolvedKeybinding {
    const ctrlKey = e.ctrlKey || (this._mapAltGrToCtrlAlt && e.getModifierState?.('AltGraph'));
    const altKey = e.altKey || (this._mapAltGrToCtrlAlt && e.getModifierState?.('AltGraph'));

    const chord = new ScanCodeChord(
      ctrlKey,
      e.shiftKey,
      altKey,
      e.metaKey,
      ScanCodeUtils.fromString(e.code),
    );
    const result = this.resolveKeybinding(new Keybinding([chord]))[0];
    return result;
  }

  public resolveKeybinding(keybinding: Keybinding): ResolvedKeybinding[] {
    return USLayoutResolvedKeybinding.resolveKeybinding(keybinding, this._OS);
  }

  public getDispatchStrForScanCodeChord(chord: ScanCodeChord): string | null {
    const codeDispatch = this._scanCodeToDispatch[chord.code];
    if (!codeDispatch) {
      return null;
    }
    let result = '';

    if (chord.ctrlKey) {
      result += 'ctrl+';
    }
    if (chord.shiftKey) {
      result += 'shift+';
    }
    if (chord.altKey) {
      result += 'alt+';
    }
    if (chord.metaKey) {
      result += 'meta+';
    }
    result += codeDispatch;

    return result;
  }
}
