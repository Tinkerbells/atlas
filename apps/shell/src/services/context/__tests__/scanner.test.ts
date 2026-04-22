import { describe, expect, it } from "vitest";

import type { Token } from "../scanner";

import { Scanner, TokenType } from "../scanner";

function tokenType(token: Token): TokenType {
  return token.type;
}

function _tokenStr(token: Token): string {
  return Scanner.getLexeme(token);
}

describe("scanner", () => {
  it("scans empty input", () => {
    const tokens = new Scanner().reset("").scan();
    expect(tokens).toHaveLength(1);
    expect(tokenType(tokens[0])).toBe(TokenType.EOF);
  });

  it("scans whitespace only", () => {
    const tokens = new Scanner().reset("  \t\n  ").scan();
    expect(tokens).toHaveLength(1);
    expect(tokenType(tokens[0])).toBe(TokenType.EOF);
  });

  it("scans single tokens", () => {
    const cases: [string, TokenType][] = [
      ["(", TokenType.LParen],
      [")", TokenType.RParen],
      ["!", TokenType.Neg],
      ["==", TokenType.Eq],
      ["===", TokenType.Eq],
      ["!=", TokenType.NotEq],
      ["!==", TokenType.NotEq],
      ["<", TokenType.Lt],
      ["<=", TokenType.LtEq],
      [">", TokenType.Gt],
      [">=", TokenType.GtEq],
      ["=~", TokenType.RegexOp],
      ["&&", TokenType.And],
      ["||", TokenType.Or],
      ["true", TokenType.True],
      ["false", TokenType.False],
      ["in", TokenType.In],
      ["not", TokenType.Not],
    ];

    for (const [input, expected] of cases) {
      const tokens = new Scanner().reset(input).scan();
      expect(tokenType(tokens[0])).toBe(expected);

      if (expected === TokenType.Eq || expected === TokenType.NotEq) {
        expect(tokens[0].type).toBe(expected);
        if (input.length === 3) {
          expect((tokens[0] as any).isTripleEq).toBe(true);
        }
        else {
          expect((tokens[0] as any).isTripleEq).toBe(false);
        }
      }
    }
  });

  it("scans identifiers", () => {
    const tokens = new Scanner().reset("foo").scan();
    expect(tokenType(tokens[0])).toBe(TokenType.Str);
    expect((tokens[0] as any).lexeme).toBe("foo");
  });

  it("scans identifiers with special chars", () => {
    const tokens = new Scanner().reset("editorTextFocus").scan();
    expect(tokenType(tokens[0])).toBe(TokenType.Str);
    expect((tokens[0] as any).lexeme).toBe("editorTextFocus");
  });

  it("scans quoted strings", () => {
    const tokens = new Scanner().reset("'hello world'").scan();
    expect(tokenType(tokens[0])).toBe(TokenType.QuotedStr);
    expect((tokens[0] as any).lexeme).toBe("hello world");
  });

  it("reports error for unterminated quoted string", () => {
    const scanner = new Scanner();
    scanner.reset("'unterminated");
    const tokens = scanner.scan();
    expect(tokenType(tokens[0])).toBe(TokenType.Error);
    expect(scanner.errors).toHaveLength(1);
    expect(scanner.errors[0].additionalInfo).toContain("quote");
  });

  it("scans regex", () => {
    const tokens = new Scanner().reset("/docker/").scan();
    expect(tokenType(tokens[0])).toBe(TokenType.RegexStr);
    expect((tokens[0] as any).lexeme).toBe("/docker/");
  });

  it("scans regex with flags", () => {
    const tokens = new Scanner().reset("/docker/gi").scan();
    expect(tokenType(tokens[0])).toBe(TokenType.RegexStr);
    expect((tokens[0] as any).lexeme).toBe("/docker/gi");
  });

  it("scans regex with escaped slash", () => {
    const tokens = new Scanner().reset("/file:\\/\\/\\//").scan();
    expect(tokenType(tokens[0])).toBe(TokenType.RegexStr);
  });

  it("reports error for unterminated regex", () => {
    const scanner = new Scanner();
    scanner.reset("/unterminated");
    const tokens = scanner.scan();
    expect(tokenType(tokens[0])).toBe(TokenType.Error);
    expect(scanner.errors).toHaveLength(1);
    expect(scanner.errors[0].additionalInfo).toContain("slash");
  });

  it("scans complex expression", () => {
    const tokens = new Scanner().reset("foo == bar && !baz").scan();
    const types = tokens.map(tokenType);
    expect(types).toEqual([
      TokenType.Str,
      TokenType.Eq,
      TokenType.Str,
      TokenType.And,
      TokenType.Neg,
      TokenType.Str,
      TokenType.EOF,
    ]);
  });

  it("scans regex expression", () => {
    const tokens = new Scanner().reset("resourceFileName =~ /docker/").scan();
    const types = tokens.map(tokenType);
    expect(types).toEqual([
      TokenType.Str,
      TokenType.RegexOp,
      TokenType.RegexStr,
      TokenType.EOF,
    ]);
  });

  it("reports error for single =", () => {
    const scanner = new Scanner();
    scanner.reset("=");
    scanner.scan();
    expect(scanner.errors).toHaveLength(1);
  });

  it("reports error for single &", () => {
    const scanner = new Scanner();
    scanner.reset("&");
    scanner.scan();
    expect(scanner.errors).toHaveLength(1);
  });

  it("reports error for single |", () => {
    const scanner = new Scanner();
    scanner.reset("|");
    scanner.scan();
    expect(scanner.errors).toHaveLength(1);
  });

  it("scans not-in pattern", () => {
    const tokens = new Scanner().reset("foo not in bar").scan();
    const types = tokens.map(tokenType);
    expect(types).toEqual([
      TokenType.Str,
      TokenType.Not,
      TokenType.In,
      TokenType.Str,
      TokenType.EOF,
    ]);
  });

  it("scanner.getLexeme round-trips", () => {
    const input = "foo == 'bar' && baz =~ /test/i";
    const tokens = new Scanner().reset(input).scan();
    const lexemes = tokens.map(t => Scanner.getLexeme(t));
    expect(lexemes).toEqual(["foo", "==", "bar", "&&", "baz", "=~", "/test/i", "EOF"]);
  });
});
