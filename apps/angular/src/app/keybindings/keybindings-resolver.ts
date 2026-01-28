import type { IContext } from '~/context/context.service';
import type { ContextKeyExpression } from '~/context/parser';
import type { ResolvedKeybindingItem } from './resolved-keybinding-item';

export enum ResultKind {
  NoMatchingKb,
  MoreChordsNeeded,
  KbFound,
}

export type ResolutionResult =
  | { kind: ResultKind.NoMatchingKb }
  | { kind: ResultKind.MoreChordsNeeded }
  | {
      kind: ResultKind.KbFound;
      commandId: string | null;
      commandArgs: any;
      isBubble: boolean;
    };

export const NoMatchingKb: ResolutionResult = { kind: ResultKind.NoMatchingKb };
export const MoreChordsNeeded: ResolutionResult = {
  kind: ResultKind.MoreChordsNeeded,
};
function KbFound(
  commandId: string | null,
  commandArgs: any,
  isBubble: boolean,
): ResolutionResult {
  return { kind: ResultKind.KbFound, commandId, commandArgs, isBubble };
}

export class KeybindingResolver {
  private readonly _defaultKeybindings: ResolvedKeybindingItem[];
  private readonly _keybindings: ResolvedKeybindingItem[];
  private readonly _map: Map<string, ResolvedKeybindingItem[]>;

  constructor(
    defaultKeybindings: ResolvedKeybindingItem[],
    overrides: ResolvedKeybindingItem[],
  ) {
    this._defaultKeybindings = defaultKeybindings;
    this._map = new Map<string, ResolvedKeybindingItem[]>();

    this._keybindings = [...this._defaultKeybindings, ...overrides];

    for (let i = 0, len = this._keybindings.length; i < len; i++) {
      const k = this._keybindings[i];
      if (k.chords.length === 0) {
        continue;
      }

      this._addKeyPress(k.chords[0], k);
    }
  }

  private _addKeyPress(keypress: string, item: ResolvedKeybindingItem): void {
    const list = this._map.get(keypress);
    if (!list) {
      this._map.set(keypress, [item]);
    } else {
      list.push(item);
    }
  }

  public resolve(
    context: IContext,
    currentChords: string[],
    keypress: string,
  ): ResolutionResult {
    const chordCount = currentChords.length;
    const firstChord = chordCount === 0 ? keypress : currentChords[0];
    const kbCandidates = this._map.get(firstChord);

    if (kbCandidates === undefined) {
      return NoMatchingKb;
    }

    let lookupMap: ResolvedKeybindingItem[] | null = null;

    if (chordCount < 1) {
      lookupMap = kbCandidates;
    } else {
      lookupMap = [];
      for (let i = 0, len = kbCandidates.length; i < len; i++) {
        const candidate = kbCandidates[i];

        if (chordCount + 1 > candidate.chords.length) {
          continue;
        }

        let prefixMatches = true;
        for (let j = 1; j <= chordCount; j++) {
          if (candidate.chords[j] !== currentChords[j]) {
            prefixMatches = false;
            break;
          }
        }
        if (prefixMatches) {
          lookupMap.push(candidate);
        }
      }
    }

    const result = this._findCommand(context, lookupMap);
    if (!result) {
      return NoMatchingKb;
    }

    if (chordCount < result.chords.length) {
      return MoreChordsNeeded;
    }

    return KbFound(result.command, result.commandArgs, result.bubble);
  }

  private _findCommand(
    context: IContext,
    matches: ResolvedKeybindingItem[],
  ): ResolvedKeybindingItem | null {
    for (let i = matches.length - 1; i >= 0; i--) {
      const k = matches[i];

      if (!KeybindingResolver._contextMatchesRules(context, k.when)) {
        continue;
      }

      return k;
    }

    return null;
  }

  private static _contextMatchesRules(
    context: IContext,
    rules: ContextKeyExpression | null | undefined,
  ): boolean {
    if (!rules) {
      return true;
    }

    return rules.evaluate(context);
  }

  public getDefaultKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._defaultKeybindings;
  }

  public getKeybindings(): readonly ResolvedKeybindingItem[] {
    return this._keybindings;
  }
}
