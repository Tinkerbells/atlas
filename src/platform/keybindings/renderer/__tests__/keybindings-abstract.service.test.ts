import { describe, expect, it } from "vitest";

import type { ILogger } from "@/platform/logger/common/logger";
import type { Keybinding } from "@/platform/keybindings/renderer/keybindings";
import type { ICommandService } from "@/platform/commands/renderer/commands-service";
import type { IKeypressEventBus } from "@/platform/keybindings/renderer/keypress-event-bus";
import type { IKeybindingItem } from "@/platform/keybindings/renderer/keybindings-registry";
import type { ResolvedKeybinding } from "@/platform/keybindings/renderer/resolved-keybinding";
import type { ResolvedKeybindingItem } from "@/platform/keybindings/renderer/resolved-keybinding-item";
import type { IContextKeyService, IContextKeyServiceTarget } from "@/platform/context/renderer/context-key";

import { OperatingSystem } from "@/core/base";
import { ContextKeyExpr } from "@/platform/context/renderer/context-key";
import { createMockLogger } from "@/platform/logger/renderer/mock-logger";
import { KeyboardMapper } from "@/platform/keybindings/renderer/keyboard-mapper";
import { ScanCode, ScanCodeUtils } from "@/platform/keybindings/renderer/scan-code";
import { KeybindingResolver } from "@/platform/keybindings/renderer/keybindings-resolver";
import { createMockCommandService } from "@/platform/commands/renderer/mock-command-service";
import { createMockContextKeyService } from "@/platform/context/renderer/mock-context-key-service";
import { AbstractKeybindingService } from "@/platform/keybindings/renderer/keybindings-abstract.service";
import { createContext, kbItem, keyChord, KeyMod, scanCodeChord } from "@/platform/keybindings/renderer/test-utils";

function createMockKeypressBus(): IKeypressEventBus {
  return {
    _serviceBrand: undefined,
    onKeypress: () => ({ dispose: () => {} }),
    emit: () => {},
  };
}

class TestKeybindingService extends AbstractKeybindingService {
  private _resolver: KeybindingResolver;
  private _keyboardMapper: KeyboardMapper;

  constructor(
    resolver: KeybindingResolver,
    contextKeyService: IContextKeyService,
    commandService: ICommandService,
    logger: ILogger,
    keypressBus: IKeypressEventBus,
  ) {
    super(contextKeyService, commandService, logger, keypressBus);
    this._resolver = resolver;
    this._keyboardMapper = new KeyboardMapper(OperatingSystem.Macintosh, false);
  }

  protected _getResolver(): KeybindingResolver {
    return this._resolver;
  }

  protected _documentHasFocus(): boolean {
    return true;
  }

  public resolveKeybinding(_kb: Keybinding): IKeybindingItem[] {
    return [];
  }

  public resolveKeyboardEvent(keyboardEvent: KeyboardEvent): ResolvedKeybinding {
    return this._keyboardMapper.resolveKeyboardEvent(keyboardEvent);
  }

  public testDispatch(encodedKeybinding: number): boolean {
    const chord = scanCodeChord(encodedKeybinding);
    const fakeEvent = {
      ctrlKey: chord.ctrlKey,
      shiftKey: chord.shiftKey,
      altKey: chord.altKey,
      metaKey: chord.metaKey,
      code: ScanCodeUtils.toString(chord.code),
      key: "",
      target: {} as HTMLElement,
      preventDefault: () => {},
    } as unknown as KeyboardEvent;

    return this._dispatch(fakeEvent, fakeEvent.target as unknown as IContextKeyServiceTarget);
  }
}

interface TestEnv {
  kbService: TestKeybindingService;
  executeCommandCalls: ReturnType<typeof createMockCommandService>["calls"];
}

function createTestEnv(items: ResolvedKeybindingItem[]): TestEnv {
  const { service: commandService, calls: executeCommandCalls } = createMockCommandService();
  const logger = createMockLogger();
  const keypressBus = createMockKeypressBus();
  const { service: contextKeyService } = createMockContextKeyService(createContext({}));

  const resolver = new KeybindingResolver(items, []);
  const kbService = new TestKeybindingService(resolver, contextKeyService, commandService, logger, keypressBus);

  return { kbService, executeCommandCalls };
}

describe("abstractKeybindingService", () => {
  describe("single- and multi-chord dispatch", () => {
    it("a single-chord keybinding is dispatched correctly", () => {
      const key = KeyMod.CtrlCmd | ScanCode.KeyK;
      const { kbService, executeCommandCalls } = createTestEnv([
        kbItem(key, "myCommand"),
      ]);

      const shouldPreventDefault = kbService.testDispatch(key);
      expect(shouldPreventDefault).toBe(true);
      expect(executeCommandCalls).toEqual([{ commandId: "myCommand", args: [null] }]);

      kbService.dispose();
    });

    it("a multi-chord keybinding is dispatched correctly", () => {
      const chord0 = KeyMod.CtrlCmd | ScanCode.KeyK;
      const chord1 = KeyMod.CtrlCmd | ScanCode.KeyI;
      const key = keyChord(chord0, chord1);
      const { kbService, executeCommandCalls } = createTestEnv([
        kbItem(key, "myCommand"),
      ]);

      let shouldPreventDefault = kbService.testDispatch(chord0);
      expect(shouldPreventDefault).toBe(true);
      expect(executeCommandCalls).toEqual([]);

      shouldPreventDefault = kbService.testDispatch(chord1);
      expect(shouldPreventDefault).toBe(true);
      expect(executeCommandCalls).toEqual([{ commandId: "myCommand", args: [null] }]);

      kbService.dispose();
    });
  });

  describe("keybindings with empty-string/null command ID", () => {
    it("a single-chord keybinding with an empty string command ID unbinds the keybinding", () => {
      const { kbService, executeCommandCalls } = createTestEnv([
        kbItem(KeyMod.CtrlCmd | ScanCode.KeyK, "myCommand"),
        kbItem(KeyMod.CtrlCmd | ScanCode.KeyK, ""),
      ]);

      const shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | ScanCode.KeyK);
      expect(shouldPreventDefault).toBe(false);
      expect(executeCommandCalls).toEqual([]);

      kbService.dispose();
    });

    it("a single-chord keybinding with a null command ID unbinds the keybinding", () => {
      const { kbService, executeCommandCalls } = createTestEnv([
        kbItem(KeyMod.CtrlCmd | ScanCode.KeyK, "myCommand"),
        kbItem(KeyMod.CtrlCmd | ScanCode.KeyK, null as unknown as string),
      ]);

      const shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | ScanCode.KeyK);
      expect(shouldPreventDefault).toBe(false);
      expect(executeCommandCalls).toEqual([]);

      kbService.dispose();
    });

    it("a multi-chord keybinding with an empty string command ID keeps the keybinding (shouldPreventDefault = true)", () => {
      const chord0 = KeyMod.CtrlCmd | ScanCode.KeyK;
      const chord1 = KeyMod.CtrlCmd | ScanCode.KeyI;
      const key = keyChord(chord0, chord1);
      const { kbService, executeCommandCalls } = createTestEnv([
        kbItem(key, "myCommand"),
        kbItem(key, ""),
      ]);

      let shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | ScanCode.KeyK);
      expect(shouldPreventDefault).toBe(true);
      expect(executeCommandCalls).toEqual([]);

      shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | ScanCode.KeyI);
      expect(shouldPreventDefault).toBe(true);
      expect(executeCommandCalls).toEqual([]);

      kbService.dispose();
    });

    it("a multi-chord keybinding with a null command ID keeps the keybinding", () => {
      const chord0 = KeyMod.CtrlCmd | ScanCode.KeyK;
      const chord1 = KeyMod.CtrlCmd | ScanCode.KeyI;
      const key = keyChord(chord0, chord1);
      const { kbService, executeCommandCalls } = createTestEnv([
        kbItem(key, "myCommand"),
        kbItem(key, null as unknown as string),
      ]);

      let shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | ScanCode.KeyK);
      expect(shouldPreventDefault).toBe(true);
      expect(executeCommandCalls).toEqual([]);

      shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | ScanCode.KeyI);
      expect(shouldPreventDefault).toBe(true);
      expect(executeCommandCalls).toEqual([]);

      kbService.dispose();
    });
  });

  it("chord mode is quit for invalid chords", () => {
    const { kbService, executeCommandCalls } = createTestEnv([
      kbItem(keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyX), "chordCommand"),
      kbItem(ScanCode.Backspace, "simpleCommand"),
    ]);

    let shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | ScanCode.KeyK);
    expect(shouldPreventDefault).toBe(true);
    expect(executeCommandCalls).toEqual([]);

    shouldPreventDefault = kbService.testDispatch(ScanCode.Backspace);
    expect(shouldPreventDefault).toBe(true);
    expect(executeCommandCalls).toEqual([]);

    shouldPreventDefault = kbService.testDispatch(ScanCode.Backspace);
    expect(shouldPreventDefault).toBe(true);
    expect(executeCommandCalls).toEqual([{ commandId: "simpleCommand", args: [null] }]);

    kbService.dispose();
  });

  it("keybinding service should not dispatch on modifier keys alone", () => {
    const { kbService, executeCommandCalls } = createTestEnv([
      kbItem(ScanCode.ControlLeft, "nope"),
      kbItem(ScanCode.ShiftLeft, "nope"),
      kbItem(ScanCode.AltLeft, "nope"),
      kbItem(ScanCode.MetaLeft, "nope"),
    ]);

    function assertIsIgnored(keybinding: number) {
      const shouldPreventDefault = kbService.testDispatch(keybinding);
      expect(shouldPreventDefault).toBe(false);
      expect(executeCommandCalls).toEqual([]);
    }

    assertIsIgnored(ScanCode.ControlLeft);
    assertIsIgnored(ScanCode.ShiftLeft);
    assertIsIgnored(ScanCode.AltLeft);
    assertIsIgnored(ScanCode.MetaLeft);

    kbService.dispose();
  });

  it("can trigger command that is sharing keybinding with chord", () => {
    const { kbService, executeCommandCalls } = createTestEnv([
      kbItem(keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyX), "chordCommand"),
      kbItem(KeyMod.CtrlCmd | ScanCode.KeyK, "simpleCommand", null, ContextKeyExpr.has("key1")),
    ]);

    let shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | ScanCode.KeyK);
    expect(shouldPreventDefault).toBe(true);
    expect(executeCommandCalls).toEqual([]);

    shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | ScanCode.KeyX);
    expect(shouldPreventDefault).toBe(true);
    expect(executeCommandCalls).toEqual([{ commandId: "chordCommand", args: [null] }]);

    kbService.dispose();
  });

  it("cannot trigger chord if command is overwriting", () => {
    const { kbService, executeCommandCalls } = createTestEnv([
      kbItem(keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyX), "chordCommand", null, ContextKeyExpr.has("key1")),
      kbItem(KeyMod.CtrlCmd | ScanCode.KeyK, "simpleCommand"),
    ]);

    const shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | ScanCode.KeyK);
    expect(shouldPreventDefault).toBe(true);
    expect(executeCommandCalls).toEqual([{ commandId: "simpleCommand", args: [null] }]);

    kbService.dispose();
  });

  it("spying command (^ prefix) does not prevent default", () => {
    const { kbService, executeCommandCalls } = createTestEnv([
      kbItem(KeyMod.CtrlCmd | ScanCode.KeyK, "^simpleCommand"),
    ]);

    const shouldPreventDefault = kbService.testDispatch(KeyMod.CtrlCmd | ScanCode.KeyK);
    expect(shouldPreventDefault).toBe(false);
    expect(executeCommandCalls).toEqual([{ commandId: "simpleCommand", args: [null] }]);

    kbService.dispose();
  });
});
