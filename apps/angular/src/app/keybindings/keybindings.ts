import { OperatingSystem } from '~/platform';
import { ScanCode } from './scan-code';

export const enum ScanCodeMod {
  CtrlCmd = (1 << 11) >>> 0, // 2048 (совпадает с маской)
  Shift = (1 << 10) >>> 0, // 1024
  Alt = (1 << 9) >>> 0, // 512
  WinCtrl = (1 << 8) >>> 0, // 256
}

export const enum BinaryScanCodeMask {
  CtrlCmd = (1 << 11) >>> 0, // 2048 (bit 11)
  Shift = (1 << 10) >>> 0, // 1024 (bit 10)
  Alt = (1 << 9) >>> 0, // 512 (bit 9)
  WinCtrl = (1 << 8) >>> 0, // 256 (bit 8)
  ScanCode = 0x000000ff, // 255 (биты 0-7)
}

export interface Modifiers {
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

export class ScanCodeChord implements Modifiers {
  constructor(
    public readonly ctrlKey: boolean,
    public readonly shiftKey: boolean,
    public readonly altKey: boolean,
    public readonly metaKey: boolean,
    public readonly code: ScanCode,
  ) {}

  /**
   * Создает ScanCodeChord из 16-битного числа keybinding
   *
   * Пример: 2103 (Ctrl+K)
   */
  public static fromNumber(
    keybinding: number,
    OS: OperatingSystem,
  ): ScanCodeChord {
    const ctrlCmd = (keybinding & BinaryScanCodeMask.CtrlCmd) !== 0;
    const shiftKey = (keybinding & BinaryScanCodeMask.Shift) !== 0;
    const altKey = (keybinding & BinaryScanCodeMask.Alt) !== 0;
    const winCtrl = (keybinding & BinaryScanCodeMask.WinCtrl) !== 0;

    // Mac: Ctrl=Cbit, Meta=Wbit | Win: Ctrl=Wbit, Meta=Cbit
    const ctrlKey = OS === OperatingSystem.Macintosh ? winCtrl : ctrlCmd;
    const metaKey = OS === OperatingSystem.Macintosh ? ctrlCmd : winCtrl;

    const scanCode = (keybinding & BinaryScanCodeMask.ScanCode) as ScanCode;

    return new ScanCodeChord(ctrlKey, shiftKey, altKey, metaKey, scanCode);
  }

  public toNumber(OS: OperatingSystem): number {
    const ctrlCmd = this.ctrlKey;
    const winCtrl = this.metaKey;

    const ctrlCmdFlag = OS === OperatingSystem.Macintosh ? winCtrl : ctrlCmd;
    const winCtrlFlag = OS === OperatingSystem.Macintosh ? ctrlCmd : winCtrl;

    let result = this.code;

    if (ctrlCmdFlag) result |= BinaryScanCodeMask.CtrlCmd;
    if (this.shiftKey) result |= BinaryScanCodeMask.Shift;
    if (this.altKey) result |= BinaryScanCodeMask.Alt;
    if (winCtrlFlag) result |= BinaryScanCodeMask.WinCtrl;

    return result >>> 0;
  }

  /**
   * Равенство двух chord'ов
   */
  public equals(other: ScanCodeChord): boolean {
    return (
      this.ctrlKey === other.ctrlKey &&
      this.shiftKey === other.shiftKey &&
      this.altKey === other.altKey &&
      this.metaKey === other.metaKey &&
      this.code === other.code
    );
  }

  public isModifierKey(): boolean {
    return (
      this.code === ScanCode.ControlLeft ||
      this.code === ScanCode.ControlRight ||
      this.code === ScanCode.ShiftLeft ||
      this.code === ScanCode.ShiftRight ||
      this.code === ScanCode.AltLeft ||
      this.code === ScanCode.AltRight ||
      this.code === ScanCode.MetaLeft ||
      this.code === ScanCode.MetaRight
    );
  }
}

export type Chord = ScanCodeChord;

export class Keybinding {
  public readonly chords: Chord[];

  constructor(chords: Chord[]) {
    if (!chords || chords.length === 0) {
      throw new Error('Keybinding must contain at least one chord.');
    }
    this.chords = chords;
  }

  public static fromNumber(
    keybinding: number,
    OS: OperatingSystem,
  ): Keybinding | null {
    if (keybinding === 0) {
      return null;
    }

    const firstChord = (keybinding & 0x0000ffff) >>> 0;
    const secondChord = (keybinding & 0xffff0000) >>> 16;

    if (secondChord !== 0) {
      return new Keybinding([
        ScanCodeChord.fromNumber(firstChord, OS),
        ScanCodeChord.fromNumber(secondChord, OS),
      ]);
    }

    return new Keybinding([ScanCodeChord.fromNumber(firstChord, OS)]);
  }

  public toNumber(OS: OperatingSystem): number {
    let result = 0;

    if (this.chords.length > 0) {
      result = this.chords[0].toNumber(OS);
    }

    if (this.chords.length > 1) {
      result = result | ((this.chords[1].toNumber(OS) & 0xffff) << 16);
    }

    return result >>> 0;
  }

  hasMultipleChords(): boolean {
    return this.chords.length > 1;
  }

  equals(other: Keybinding | null | undefined): boolean {
    if (!other) return false;
    if (this.chords.length !== other.chords.length) return false;

    for (let i = 0; i < this.chords.length; i++) {
      if (!this.chords[i].equals(other.chords[i])) return false;
    }
    return true;
  }
}

/**
 * Главная функция декодирования (как VS Code)
 *
 * @param keybinding - число или массив чисел
 * @param OS - операционная система
 */
export function decodeKeybinding(
  keybinding: number | number[],
  OS: OperatingSystem,
): Keybinding | null {
  if (typeof keybinding === 'number') {
    return Keybinding.fromNumber(keybinding, OS);
  } else {
    const chords = keybinding.map((kb) => ScanCodeChord.fromNumber(kb, OS));
    return new Keybinding(chords);
  }
}
