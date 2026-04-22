import { OperatingSystem } from "@atlas/shared";

import type { ScanCode } from "../scan-code";
import type { ContextKeyExpression } from "../../context/context-key";

import { ResolvedKeybindingItem } from "../resolved-keybinding-item";
import { decodeKeybinding, ScanCodeChord, ScanCodeMod } from "../keybindings";
import { USLayoutResolvedKeybinding } from "../us-layout-resolved-keybinding";

export { createContext } from "../../context/mock-context-key-service";

export function kbItem(
  keybinding: number | number[],
  command: string,
  commandArgs: unknown = null,
  when: ContextKeyExpression | undefined = undefined,
  isDefault: boolean = true,
): ResolvedKeybindingItem {
  const kb = keybinding === 0 ? null : decodeKeybinding(keybinding, OperatingSystem.Macintosh);
  let resolvedKeybinding: ReturnType<typeof USLayoutResolvedKeybinding.resolveKeybinding>[number] | undefined;

  if (kb) {
    const results = USLayoutResolvedKeybinding.resolveKeybinding(kb, OperatingSystem.Macintosh);
    resolvedKeybinding = results.length > 0 ? results[0] : undefined;
  }

  return new ResolvedKeybindingItem(
    resolvedKeybinding,
    command,
    commandArgs,
    when,
    isDefault,
  );
}

export function getDispatchStr(chord: ScanCodeChord): string {
  return USLayoutResolvedKeybinding.getDispatchStr(chord)!;
}

export function createScanCodeChord(
  ctrlCmd: boolean,
  shift: boolean,
  alt: boolean,
  scanCode: ScanCode,
): ScanCodeChord {
  return new ScanCodeChord(ctrlCmd, shift, alt, false, scanCode);
}

export const KeyMod = {
  CtrlCmd: ScanCodeMod.CtrlCmd,
  Shift: ScanCodeMod.Shift,
  Alt: ScanCodeMod.Alt,
  WinCtrl: ScanCodeMod.WinCtrl,
};

export function scanCodeChord(keybinding: number): ScanCodeChord {
  return ScanCodeChord.fromNumber(keybinding, OperatingSystem.Macintosh);
}

export function keyChord(first: number, second: number): number[] {
  return [first, second];
}
