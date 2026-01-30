/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { Scanner, Token, TokenType } from '../scanner';

function tokenTypeToStr(token: Token): string {
  switch (token.type) {
    case TokenType.LParen:
      return '(';
    case TokenType.RParen:
      return ')';
    case TokenType.Neg:
      return '!';
    case TokenType.Eq:
      return token.isTripleEq ? '===' : '==';
    case TokenType.NotEq:
      return token.isTripleEq ? '!==' : '!=';
    case TokenType.Lt:
      return '<';
    case TokenType.LtEq:
      return '<=';
    case TokenType.Gt:
      return '>';
    case TokenType.GtEq:
      return '>=';
    case TokenType.RegexOp:
      return '=~';
    case TokenType.RegexStr:
      return 'RegexStr';
    case TokenType.True:
      return 'true';
    case TokenType.False:
      return 'false';
    case TokenType.In:
      return 'in';
    case TokenType.Not:
      return 'not';
    case TokenType.And:
      return '&&';
    case TokenType.Or:
      return '||';
    case TokenType.Str:
      return 'Str';
    case TokenType.QuotedStr:
      return 'QuotedStr';
    case TokenType.Error:
      return 'ErrorToken';
    case TokenType.EOF:
      return 'EOF';
  }
}

function scan(input: string) {
  return new Scanner()
    .reset(input)
    .scan()
    .map((token: Token) => {
      return 'lexeme' in token
        ? {
            type: tokenTypeToStr(token),
            offset: token.offset,
            lexeme: token.lexeme,
          }
        : {
            type: tokenTypeToStr(token),
            offset: token.offset,
          };
    });
}

describe('Context Key Scanner', () => {
  describe('scanning various cases of context keys', () => {
    it('foo.bar<C-shift+2>', () => {
      const input = 'foo.bar<C-shift+2>';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'foo.bar<C-shift+2>', offset: 0 },
        { type: 'EOF', offset: 18 },
      ]);
    });

    it('!foo', () => {
      const input = '!foo';
      expect(scan(input)).toStrictEqual([
        { type: '!', offset: 0 },
        { type: 'Str', lexeme: 'foo', offset: 1 },
        { type: 'EOF', offset: 4 },
      ]);
    });

    it('foo === bar', () => {
      const input = 'foo === bar';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', offset: 0, lexeme: 'foo' },
        { type: '===', offset: 4 },
        { type: 'Str', offset: 8, lexeme: 'bar' },
        { type: 'EOF', offset: 11 },
      ]);
    });

    it('foo  !== bar', () => {
      const input = 'foo  !== bar';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', offset: 0, lexeme: 'foo' },
        { type: '!==', offset: 5 },
        { type: 'Str', offset: 9, lexeme: 'bar' },
        { type: 'EOF', offset: 12 },
      ]);
    });

    it('!(foo && bar)', () => {
      const input = '!(foo && bar)';
      expect(scan(input)).toStrictEqual([
        { type: '!', offset: 0 },
        { type: '(', offset: 1 },
        { type: 'Str', lexeme: 'foo', offset: 2 },
        { type: '&&', offset: 6 },
        { type: 'Str', lexeme: 'bar', offset: 9 },
        { type: ')', offset: 12 },
        { type: 'EOF', offset: 13 },
      ]);
    });

    it('=~ ', () => {
      const input = '=~ ';
      expect(scan(input)).toStrictEqual([
        { type: '=~', offset: 0 },
        { type: 'EOF', offset: 3 },
      ]);
    });

    it('foo =~ /bar/', () => {
      const input = 'foo =~ /bar/';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'foo', offset: 0 },
        { type: '=~', offset: 4 },
        { type: 'RegexStr', lexeme: '/bar/', offset: 7 },
        { type: 'EOF', offset: 12 },
      ]);
    });

    it('foo =~ /zee/i', () => {
      const input = 'foo =~ /zee/i';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'foo', offset: 0 },
        { type: '=~', offset: 4 },
        { type: 'RegexStr', lexeme: '/zee/i', offset: 7 },
        { type: 'EOF', offset: 13 },
      ]);
    });

    it('foo =~ /zee/gm', () => {
      const input = 'foo =~ /zee/gm';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'foo', offset: 0 },
        { type: '=~', offset: 4 },
        { type: 'RegexStr', lexeme: '/zee/gm', offset: 7 },
        { type: 'EOF', offset: 14 },
      ]);
    });

    it('foo in barrr  ', () => {
      const input = 'foo in barrr  ';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'foo', offset: 0 },
        { type: 'in', offset: 4 },
        { type: 'Str', lexeme: 'barrr', offset: 7 },
        { type: 'EOF', offset: 14 },
      ]);
    });

    it('!(foo && bar) && baz', () => {
      const input = '!(foo && bar) && baz';
      expect(scan(input)).toStrictEqual([
        { type: '!', offset: 0 },
        { type: '(', offset: 1 },
        { type: 'Str', lexeme: 'foo', offset: 2 },
        { type: '&&', offset: 6 },
        { type: 'Str', lexeme: 'bar', offset: 9 },
        { type: ')', offset: 12 },
        { type: '&&', offset: 14 },
        { type: 'Str', lexeme: 'baz', offset: 17 },
        { type: 'EOF', offset: 20 },
      ]);
    });

    it('foo.bar:zed==completed - equality with no space', () => {
      const input = 'foo.bar:zed==completed';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'foo.bar:zed', offset: 0 },
        { type: '==', offset: 11 },
        { type: 'Str', lexeme: 'completed', offset: 13 },
        { type: 'EOF', offset: 22 },
      ]);
    });

    it('a && b || c', () => {
      const input = 'a && b || c';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'a', offset: 0 },
        { type: '&&', offset: 2 },
        { type: 'Str', lexeme: 'b', offset: 5 },
        { type: '||', offset: 7 },
        { type: 'Str', lexeme: 'c', offset: 10 },
        { type: 'EOF', offset: 11 },
      ]);
    });

    it('fooBar && baz.jar && fee.bee<K-loo+1>', () => {
      const input = 'fooBar && baz.jar && fee.bee<K-loo+1>';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'fooBar', offset: 0 },
        { type: '&&', offset: 7 },
        { type: 'Str', lexeme: 'baz.jar', offset: 10 },
        { type: '&&', offset: 18 },
        { type: 'Str', lexeme: 'fee.bee<K-loo+1>', offset: 21 },
        { type: 'EOF', offset: 37 },
      ]);
    });

    it('foo.barBaz<C-r> < 2', () => {
      const input = 'foo.barBaz<C-r> < 2';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'foo.barBaz<C-r>', offset: 0 },
        { type: '<', offset: 16 },
        { type: 'Str', lexeme: '2', offset: 18 },
        { type: 'EOF', offset: 19 },
      ]);
    });

    it('foo.bar >= -1', () => {
      const input = 'foo.bar >= -1';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'foo.bar', offset: 0 },
        { type: '>=', offset: 8 },
        { type: 'Str', lexeme: '-1', offset: 11 },
        { type: 'EOF', offset: 13 },
      ]);
    });

    it('foo.bar <= -1', () => {
      const input = 'foo.bar <= -1';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'foo.bar', offset: 0 },
        { type: '<=', offset: 8 },
        { type: 'Str', lexeme: '-1', offset: 11 },
        { type: 'EOF', offset: 13 },
      ]);
    });

    it('view == vsc-packages-activitybar-folders && vsc-packages-folders-loaded', () => {
      const input =
        'view == vsc-packages-activitybar-folders && vsc-packages-folders-loaded';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'view', offset: 0 },
        { type: '==', offset: 5 },
        {
          type: 'Str',
          lexeme: 'vsc-packages-activitybar-folders',
          offset: 8,
        },
        { type: '&&', offset: 41 },
        {
          type: 'Str',
          lexeme: 'vsc-packages-folders-loaded',
          offset: 44,
        },
        { type: 'EOF', offset: 71 },
      ]);
    });

    it('sfdx:project_opened && resource =~ /.*\\/functions\\/.*\\/[^\\/]+(\\/[^\\/]+\\.(ts|js|java|json|toml))?$/ && resourceFilename != package.json && resourceFilename != package-lock.json && resourceFilename != tsconfig.json', () => {
      const input =
        "sfdx:project_opened && resource =~ /.*\\/functions\\/.*\\/[^\\/]+(\\/[^\\/]+\\.(ts|js|java|json|toml))?$/ && resourceFilename != package.json && resourceFilename != package-lock.json && resourceFilename != tsconfig.json";
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'sfdx:project_opened', offset: 0 },
        { type: '&&', offset: 20 },
        { type: 'Str', lexeme: 'resource', offset: 23 },
        { type: '=~', offset: 32 },
        {
          type: 'RegexStr',
          lexeme: '/.*\\/functions\\/.*\\/[^\\/]+(\\/[^\\/]+\\.(ts|js|java|json|toml))?$/',
          offset: 35,
        },
        { type: '&&', offset: 99 },
        { type: 'Str', lexeme: 'resourceFilename', offset: 102 },
        { type: '!=', offset: 119 },
        { type: 'Str', lexeme: 'package.json', offset: 122 },
        { type: '&&', offset: 135 },
        { type: 'Str', lexeme: 'resourceFilename', offset: 138 },
        { type: '!=', offset: 155 },
        { type: 'Str', lexeme: 'package-lock.json', offset: 158 },
        { type: '&&', offset: 176 },
        { type: 'Str', lexeme: 'resourceFilename', offset: 179 },
        { type: '!=', offset: 196 },
        { type: 'Str', lexeme: 'tsconfig.json', offset: 199 },
        { type: 'EOF', offset: 212 },
      ]);
    });

    it("view =~ '/(servers)/' && viewItem =~ '/^(Starting|Started|Debugging|Stopping|Stopped)/'", () => {
      const input = "view =~ '/(servers)/' && viewItem =~ '/^(Starting|Started|Debugging|Stopping|Stopped)/'";
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'view', offset: 0 },
        { type: '=~', offset: 5 },
        { type: 'QuotedStr', lexeme: '/(servers)/', offset: 9 },
        { type: '&&', offset: 22 },
        { type: 'Str', lexeme: 'viewItem', offset: 25 },
        { type: '=~', offset: 34 },
        {
          type: 'QuotedStr',
          lexeme: '/^(Starting|Started|Debugging|Stopping|Stopped)/',
          offset: 38,
        },
        { type: 'EOF', offset: 87 },
      ]);
    });

    it('resourcePath =~ /\\.md(\\.yml|\\.txt)*$/gim', () => {
      const input = 'resourcePath =~ /\\.md(\\.yml|\\.txt)*$/gim';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', offset: 0, lexeme: 'resourcePath' },
        { type: '=~', offset: 13 },
        { type: 'RegexStr', offset: 16, lexeme: '/\\.md(\\.yml|\\.txt)*$/gim' },
        { type: 'EOF', offset: 40 },
      ]);
    });
  });

  it("foo === bar'", () => {
    const input = "foo === bar'";
    expect(scan(input)).toStrictEqual([
      { type: 'Str', offset: 0, lexeme: 'foo' },
      { type: '===', offset: 4 },
      { type: 'Str', offset: 8, lexeme: 'bar' },
      { type: 'ErrorToken', offset: 11, lexeme: "'" },
      { type: 'EOF', offset: 12 },
    ]);
  });

  describe('handling lexical errors', () => {
    it("foo === '", () => {
      const input = "foo === '";
      expect(scan(input)).toStrictEqual([
        { type: 'Str', offset: 0, lexeme: 'foo' },
        { type: '===', offset: 4 },
        { type: 'ErrorToken', offset: 8, lexeme: "'" },
        { type: 'EOF', offset: 9 },
      ]);
    });

    it("foo && 'bar - unterminated single quote", () => {
      const input = "foo && 'bar";
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'foo', offset: 0 },
        { type: '&&', offset: 4 },
        { type: 'ErrorToken', offset: 7, lexeme: "'bar" },
        { type: 'EOF', offset: 11 },
      ]);
    });

    it('vim<c-r> == 1 && vim<2 <= 3', () => {
      const input = 'vim<c-r> == 1 && vim<2 <= 3';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', lexeme: 'vim<c-r>', offset: 0 },
        { type: '==', offset: 9 },
        { type: 'Str', lexeme: '1', offset: 12 },
        { type: '&&', offset: 14 },
        { type: 'Str', lexeme: 'vim<2', offset: 17 },
        { type: '<=', offset: 23 },
        { type: 'Str', lexeme: '3', offset: 26 },
        { type: 'EOF', offset: 27 },
      ]);
    });

    it('vim<c-r>==1 && vim<2<=3', () => {
      const input = 'vim<c-r>==1 && vim<2<=3';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', offset: 0, lexeme: 'vim<c-r>' },
        { type: '==', offset: 8 },
        { type: 'Str', offset: 10, lexeme: '1' },
        { type: '&&', offset: 12 },
        { type: 'Str', offset: 15, lexeme: 'vim<2<' },
        { type: 'ErrorToken', offset: 21, lexeme: '=' },
        { type: 'Str', offset: 22, lexeme: '3' },
        { type: 'EOF', offset: 23 },
      ]);
    });

    it('foo|bar', () => {
      const input = 'foo|bar';
      expect(scan(input)).toStrictEqual([
        { type: 'Str', offset: 0, lexeme: 'foo' },
        { type: 'ErrorToken', offset: 3, lexeme: '|' },
        { type: 'Str', offset: 4, lexeme: 'bar' },
        { type: 'EOF', offset: 7 },
      ]);
    });
  });
});
