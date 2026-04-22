import { describe, expect, it } from "vitest";

import type { ContextKeyExpression } from "../../context/context-key";

import { ScanCode } from "../scan-code";
import { ContextKeyExpr } from "../../context/context-key";
import { KeybindingResolver, ResultKind } from "../keybindings-resolver";
import {
  createContext,
  getDispatchStr,
  kbItem,
  keyChord,
  KeyMod,
  scanCodeChord,
} from "./keybindings-test-utils";

describe("keybindingResolver", () => {
  describe("resolve key", () => {
    it("resolves a keybinding with matching when context", () => {
      const keybinding = KeyMod.CtrlCmd | KeyMod.Shift | ScanCode.KeyZ;
      const runtimeKeybinding = scanCodeChord(keybinding);
      const contextRules = ContextKeyExpr.equals("bar", "baz");
      const item = kbItem(keybinding, "yes", null, contextRules, true);

      expect(contextRules.evaluate(createContext({ bar: "baz" }))).toBe(true);
      expect(contextRules.evaluate(createContext({ bar: "bz" }))).toBe(false);

      const resolver = new KeybindingResolver([item], []);

      const r1 = resolver.resolve(createContext({ bar: "baz" }), [], getDispatchStr(runtimeKeybinding));
      expect(r1.kind).toBe(ResultKind.KbFound);
      if (r1.kind === ResultKind.KbFound) {
        expect(r1.commandId).toBe("yes");
      }
    });

    it("resolves NoMatchingKb when when context does not match", () => {
      const keybinding = KeyMod.CtrlCmd | KeyMod.Shift | ScanCode.KeyZ;
      const runtimeKeybinding = scanCodeChord(keybinding);
      const contextRules = ContextKeyExpr.equals("bar", "baz");
      const item = kbItem(keybinding, "yes", null, contextRules, true);

      const resolver = new KeybindingResolver([item], []);

      const r2 = resolver.resolve(createContext({ bar: "bz" }), [], getDispatchStr(runtimeKeybinding));
      expect(r2.kind).toBe(ResultKind.NoMatchingKb);
    });

    it("resolves a keybinding with arguments", () => {
      const commandArgs = { text: "no" };
      const keybinding = KeyMod.CtrlCmd | KeyMod.Shift | ScanCode.KeyZ;
      const runtimeKeybinding = scanCodeChord(keybinding);
      const contextRules = ContextKeyExpr.equals("bar", "baz");
      const item = kbItem(keybinding, "yes", commandArgs, contextRules, true);

      const resolver = new KeybindingResolver([item], []);

      const r = resolver.resolve(createContext({ bar: "baz" }), [], getDispatchStr(runtimeKeybinding));
      expect(r.kind).toBe(ResultKind.KbFound);
      if (r.kind === ResultKind.KbFound) {
        expect(r.commandArgs).toBe(commandArgs);
      }
    });
  });

  describe("resolve command", () => {
    function _kbItem(
      keybinding: number | number[],
      command: string,
      when?: ContextKeyExpression,
    ) {
      return kbItem(keybinding, command, null, when, true);
    }

    const items = [
      _kbItem(
        ScanCode.KeyX,
        "first",
        ContextKeyExpr.and(
          ContextKeyExpr.equals("key1", true),
          ContextKeyExpr.notEquals("key2", false),
        ),
      ),
      _kbItem(
        ScanCode.KeyX,
        "second",
        ContextKeyExpr.equals("key2", true),
      ),
      _kbItem(
        ScanCode.KeyZ,
        "second",
        undefined,
      ),
      _kbItem(
        ScanCode.KeyX,
        "third",
        ContextKeyExpr.equals("key3", true),
      ),
      _kbItem(
        KeyMod.CtrlCmd | ScanCode.KeyY,
        "fourth",
        ContextKeyExpr.equals("key4", true),
      ),
      _kbItem(
        keyChord(KeyMod.CtrlCmd | ScanCode.KeyY, ScanCode.KeyZ),
        "fifth",
        undefined,
      ),
      _kbItem(
        0,
        "sixth",
        undefined,
      ),
      _kbItem(
        keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyU),
        "seventh",
        undefined,
      ),
      _kbItem(
        keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyK),
        "seventh",
        undefined,
      ),
      _kbItem(
        keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyU),
        "uncomment lines",
        undefined,
      ),
      _kbItem(
        keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyC),
        "comment lines",
        undefined,
      ),
      _kbItem(
        keyChord(KeyMod.CtrlCmd | ScanCode.KeyG, KeyMod.CtrlCmd | ScanCode.KeyC),
        "unreachablechord",
        undefined,
      ),
      _kbItem(
        KeyMod.CtrlCmd | ScanCode.KeyG,
        "eleven",
        undefined,
      ),
      _kbItem(
        [KeyMod.CtrlCmd | ScanCode.KeyK, ScanCode.KeyA, ScanCode.KeyB],
        "long multi chord",
        undefined,
      ),
      _kbItem(
        keyChord(KeyMod.CtrlCmd | ScanCode.KeyB, KeyMod.CtrlCmd | ScanCode.KeyC),
        "shadowed by long-multi-chord-2",
        undefined,
      ),
      _kbItem(
        [KeyMod.CtrlCmd | ScanCode.KeyB, KeyMod.CtrlCmd | ScanCode.KeyC, ScanCode.KeyI],
        "long-multi-chord-2",
        undefined,
      ),
    ];

    const resolver = new KeybindingResolver(items, []);

    function testResolve(
      ctx: ReturnType<typeof createContext>,
      _expectedKey: number | number[],
      commandId: string,
    ) {
      const expectedKeybinding = _expectedKey;
      const keys: number[] = Array.isArray(expectedKeybinding) ? expectedKeybinding : [expectedKeybinding];
      const previousChord: string[] = [];

      for (let i = 0; i < keys.length; i++) {
        const chord = getDispatchStr(scanCodeChord(keys[i]));
        const result = resolver.resolve(ctx, previousChord, chord);

        if (i === keys.length - 1) {
          expect(result.kind, `Should find command ${commandId} at chord ${i}`).toBe(ResultKind.KbFound);
          if (result.kind === ResultKind.KbFound) {
            expect(result.commandId, `Command at chord ${i}`).toBe(commandId);
          }
        }
        else {
          expect(result.kind, `Should need more chords for ${commandId} at chord ${i}`).toBe(ResultKind.MoreChordsNeeded);
        }
        previousChord.push(chord);
      }
    }

    function testKbLookupByCommand(commandId: string, expectedKeys: (number | number[])[]) {
      const lookupResult = resolver.lookupKeybindings(commandId);
      expect(lookupResult.length, `Length mismatch for ${commandId}`).toBe(expectedKeys.length);
    }

    it("resolve command - first is present (Atlas has no shadowing)", () => {
      testKbLookupByCommand("first", [ScanCode.KeyX]);
    });

    it("resolve command - second has two keybindings", () => {
      testKbLookupByCommand("second", [ScanCode.KeyZ, ScanCode.KeyX]);
      testResolve(createContext({ key2: true }), ScanCode.KeyX, "second");
      testResolve(createContext({}), ScanCode.KeyZ, "second");
    });

    it("resolve command - third with context", () => {
      testKbLookupByCommand("third", [ScanCode.KeyX]);
      testResolve(createContext({ key3: true }), ScanCode.KeyX, "third");
    });

    it("resolve command - fourth is present (Atlas has no shadowing)", () => {
      testKbLookupByCommand("fourth", [KeyMod.CtrlCmd | ScanCode.KeyY]);
    });

    it("resolve command - fifth chord keybinding", () => {
      testKbLookupByCommand("fifth", [keyChord(KeyMod.CtrlCmd | ScanCode.KeyY, ScanCode.KeyZ)]);
      testResolve(createContext({}), keyChord(KeyMod.CtrlCmd | ScanCode.KeyY, ScanCode.KeyZ), "fifth");
    });

    it("resolve command - seventh has both chord keybindings", () => {
      testKbLookupByCommand("seventh", [
        keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyK),
        keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyU),
      ]);
      testResolve(createContext({}), keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyK), "seventh");
    });

    it("resolve command - uncomment lines", () => {
      testKbLookupByCommand("uncomment lines", [keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyU)]);
      testResolve(createContext({}), keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyU), "uncomment lines");
    });

    it("resolve command - comment lines", () => {
      testKbLookupByCommand("comment lines", [keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyC)]);
      testResolve(createContext({}), keyChord(KeyMod.CtrlCmd | ScanCode.KeyK, KeyMod.CtrlCmd | ScanCode.KeyC), "comment lines");
    });

    it("resolve command - unreachablechord is present (Atlas has no shadowing)", () => {
      testKbLookupByCommand("unreachablechord", [keyChord(KeyMod.CtrlCmd | ScanCode.KeyG, KeyMod.CtrlCmd | ScanCode.KeyC)]);
    });

    it("resolve command - eleven single chord overrides chord prefix", () => {
      testKbLookupByCommand("eleven", [KeyMod.CtrlCmd | ScanCode.KeyG]);
      testResolve(createContext({}), KeyMod.CtrlCmd | ScanCode.KeyG, "eleven");
    });

    it("resolve command - sixth has no keybinding", () => {
      testKbLookupByCommand("sixth", []);
    });

    it("resolve command - long multi chord (3 chords)", () => {
      testKbLookupByCommand("long multi chord", [[KeyMod.CtrlCmd | ScanCode.KeyK, ScanCode.KeyA, ScanCode.KeyB]]);
      testResolve(createContext({}), [KeyMod.CtrlCmd | ScanCode.KeyK, ScanCode.KeyA, ScanCode.KeyB], "long multi chord");
    });

    it("kBs having common prefix - the one defined later is returned", () => {
      const emptyContext = createContext({});
      testResolve(emptyContext, [KeyMod.CtrlCmd | ScanCode.KeyB, KeyMod.CtrlCmd | ScanCode.KeyC, ScanCode.KeyI], "long-multi-chord-2");
    });
  });
});
