/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import {
  ContextKeyExpr,
  ContextKeyExpression,
  expressionsAreEqualWithConstantSubstitution,
  implies,
  setConstant,
  validateWhenClauses,
} from '../contex-key';

function createContext(ctx: any) {
  return {
    getValue: (key: string) => {
      return ctx[key];
    },
  };
}

describe('ContextKeyExpr', () => {
  it('ContextKeyExpr.equals', () => {
    const a = ContextKeyExpr.and(
      ContextKeyExpr.has('a1'),
      ContextKeyExpr.and(ContextKeyExpr.has('and.a')),
      ContextKeyExpr.has('a2'),
      ContextKeyExpr.regex('d3', /d.*/),
      ContextKeyExpr.regex('d4', /\*\*3*/),
      ContextKeyExpr.equals('b1', 'bb1'),
      ContextKeyExpr.equals('b2', 'bb2'),
      ContextKeyExpr.notEquals('c1', 'cc1'),
      ContextKeyExpr.notEquals('c2', 'cc2'),
      ContextKeyExpr.not('d1'),
      ContextKeyExpr.not('d2'),
    )!;
    const b = ContextKeyExpr.and(
      ContextKeyExpr.equals('b2', 'bb2'),
      ContextKeyExpr.notEquals('c1', 'cc1'),
      ContextKeyExpr.not('d1'),
      ContextKeyExpr.regex('d4', /\*\*3*/),
      ContextKeyExpr.notEquals('c2', 'cc2'),
      ContextKeyExpr.has('a2'),
      ContextKeyExpr.equals('b1', 'bb1'),
      ContextKeyExpr.regex('d3', /d.*/),
      ContextKeyExpr.has('a1'),
      ContextKeyExpr.and(ContextKeyExpr.equals('and.a', true)),
      ContextKeyExpr.not('d2'),
    )!;
    expect(a.equals(b)).toBe(true);
  });

  it('issue #134942: Equals in comparator expressions', () => {
    function testEquals(expr: ContextKeyExpression | undefined, str: string): void {
      const deserialized = ContextKeyExpr.deserialize(str);
      expect(expr).toBeDefined();
      expect(deserialized).toBeDefined();
      expect(expr?.equals(deserialized!)).toBe(true);
    }
    testEquals(ContextKeyExpr.greater('value', 0), 'value > 0');
    testEquals(ContextKeyExpr.greaterEquals('value', 0), 'value >= 0');
    testEquals(ContextKeyExpr.smaller('value', 0), 'value < 0');
    testEquals(ContextKeyExpr.smallerEquals('value', 0), 'value <= 0');
  });

  it('normalize', () => {
    const key1IsTrue = ContextKeyExpr.equals('key1', true);
    const key1IsNotFalse = ContextKeyExpr.notEquals('key1', false);
    const key1IsFalse = ContextKeyExpr.equals('key1', false);
    const key1IsNotTrue = ContextKeyExpr.notEquals('key1', true);

    expect(key1IsTrue.equals(ContextKeyExpr.has('key1'))).toBe(true);
    expect(key1IsNotFalse.equals(ContextKeyExpr.has('key1'))).toBe(true);
    expect(key1IsFalse.equals(ContextKeyExpr.not('key1'))).toBe(true);
    expect(key1IsNotTrue.equals(ContextKeyExpr.not('key1'))).toBe(true);
  });

  it('evaluate', () => {
    const context = createContext({
      a: true,
      b: false,
      c: '5',
      d: 'd',
    });

    function testExpression(expr: string, expected: boolean): void {
      const rules = ContextKeyExpr.deserialize(expr);
      expect(rules!.evaluate(context)).toBe(expected);
    }

    function testBatch(expr: string, value: any): void {
      testExpression(expr, !!value);
      testExpression(expr + ' == true', !!value);
      testExpression(expr + ' != true', !value);
      testExpression(expr + ' == false', !value);
      testExpression(expr + ' != false', !!value);
      testExpression(expr + ' == 5', value == '5');
      testExpression(expr + ' != 5', value != '5');
      testExpression('!' + expr, !value);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      testExpression(expr + ' =~ /d.*/', /d.*/.test(value));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      testExpression(expr + ' =~ /D/i', /D/i.test(value));
    }

    testBatch('a', true);
    testBatch('b', false);
    testBatch('c', '5');
    testBatch('d', 'd');
    testBatch('z', undefined);

     
    testExpression('true', true);
     
    testExpression('false', false);
    // eslint-disable-next-line no-constant-binary-expression
    testExpression('a && !b', true && !false);
    // eslint-disable-next-line no-constant-binary-expression
    testExpression('a && b', true && false);
    // eslint-disable-next-line no-constant-binary-expression
    testExpression('a && !b && c == 5', true && !false && '5' === '5');
    testExpression('d =~ /e.*/', false);

    testExpression('b && a || a', true);

    testExpression('a || b', true);
    testExpression('b || b', false);
    testExpression('b && a || a && b', false);
  });

  it('negate', () => {
    function testNegate(expr: string, expected: string): void {
      const actual = ContextKeyExpr.deserialize(expr)!.negate().serialize();
      expect(actual).toBe(expected);
    }
    testNegate('true', 'false');
    testNegate('false', 'true');
    testNegate('a', '!a');
    testNegate('a && b || c', '!a && !c || !b && !c');
    testNegate('a && b || c || d', '!a && !c && !d || !b && !c && !d');
    testNegate('!a && !b || !c && !d', 'a && c || a && d || b && c || b && d');
    testNegate('!a && !b || !c && !d || !e && !f', 'a && c && e || a && c && f || a && d && e || a && d && f || b && c && e || b && c && f || b && d && e || b && d && f');
  });

  it('false, true', () => {
    function testNormalize(expr: string, expected: string): void {
      const actual = ContextKeyExpr.deserialize(expr)!.serialize();
      expect(actual).toBe(expected);
    }
    testNormalize('true', 'true');
    testNormalize('!true', 'false');
    testNormalize('false', 'false');
    testNormalize('!false', 'true');
    testNormalize('a && true', 'a');
    testNormalize('a && false', 'false');
    testNormalize('a || true', 'true');
    testNormalize('a || false', 'a');
  });

  it('issue #101015: distribute OR', () => {
    function t(expr1: string, expr2: string, expected: string | undefined): void {
      const e1 = ContextKeyExpr.deserialize(expr1);
      const e2 = ContextKeyExpr.deserialize(expr2);
      const actual = ContextKeyExpr.and(e1, e2)?.serialize();
      expect(actual).toBe(expected);
    }
    t('a', 'b', 'a && b');
    t('a || b', 'c', 'a && c || b && c');
    t('a || b', 'c || d', 'a && c || a && d || b && c || b && d');
    t('a || b', 'c && d', 'a && c && d || b && c && d');
    t('a || b', 'c && d || e', 'a && e || b && e || a && c && d || b && c && d');
  });

  it('ContextKeyInExpr', () => {
    const ainb = ContextKeyExpr.deserialize('a in b')!;
    expect(ainb.evaluate(createContext({ a: 3, b: [3, 2, 1] }))).toBe(true);
    expect(ainb.evaluate(createContext({ a: 3, b: [1, 2, 3] }))).toBe(true);
    expect(ainb.evaluate(createContext({ a: 3, b: [1, 2] }))).toBe(false);
    expect(ainb.evaluate(createContext({ a: 3 }))).toBe(false);
    expect(ainb.evaluate(createContext({ a: 3, b: null }))).toBe(false);
    expect(ainb.evaluate(createContext({ a: 'x', b: ['x'] }))).toBe(true);
    expect(ainb.evaluate(createContext({ a: 'x', b: ['y'] }))).toBe(false);
    expect(ainb.evaluate(createContext({ a: 'x', b: {} }))).toBe(false);
    expect(ainb.evaluate(createContext({ a: 'x', b: { x: false } }))).toBe(true);
    expect(ainb.evaluate(createContext({ a: 'x', b: { x: true } }))).toBe(true);
    expect(ainb.evaluate(createContext({ a: 'prototype', b: {} }))).toBe(false);
  });

  it('ContextKeyNotInExpr', () => {
    const aNotInB = ContextKeyExpr.deserialize('a not in b')!;
    expect(aNotInB.evaluate(createContext({ a: 3, b: [3, 2, 1] }))).toBe(false);
    expect(aNotInB.evaluate(createContext({ a: 3, b: [1, 2, 3] }))).toBe(false);
    expect(aNotInB.evaluate(createContext({ a: 3, b: [1, 2] }))).toBe(true);
    expect(aNotInB.evaluate(createContext({ a: 3 }))).toBe(true);
    expect(aNotInB.evaluate(createContext({ a: 3, b: null }))).toBe(true);
    expect(aNotInB.evaluate(createContext({ a: 'x', b: ['x'] }))).toBe(false);
    expect(aNotInB.evaluate(createContext({ a: 'x', b: ['y'] }))).toBe(true);
    expect(aNotInB.evaluate(createContext({ a: 'x', b: {} }))).toBe(true);
    expect(aNotInB.evaluate(createContext({ a: 'x', b: { x: false } }))).toBe(false);
    expect(aNotInB.evaluate(createContext({ a: 'x', b: { x: true } }))).toBe(false);
    expect(aNotInB.evaluate(createContext({ a: 'prototype', b: {} }))).toBe(true);
  });

  it('issue #106524: distributing AND should normalize', () => {
    const actual = ContextKeyExpr.and(
      ContextKeyExpr.or(ContextKeyExpr.has('a'), ContextKeyExpr.has('b')),
      ContextKeyExpr.has('c'),
    );
    const expected = ContextKeyExpr.or(
      ContextKeyExpr.and(ContextKeyExpr.has('a'), ContextKeyExpr.has('c')),
      ContextKeyExpr.and(ContextKeyExpr.has('b'), ContextKeyExpr.has('c')),
    );
    expect(actual!.equals(expected!)).toBe(true);
  });

  it('issue #129625: Removes duplicated terms in OR expressions', () => {
    const expr = ContextKeyExpr.or(
      ContextKeyExpr.has('A'),
      ContextKeyExpr.has('B'),
      ContextKeyExpr.has('A'),
    )!;
    expect(expr.serialize()).toBe('A || B');
  });

  it('Resolves true constant OR expressions', () => {
    const expr = ContextKeyExpr.or(
      ContextKeyExpr.has('A'),
      ContextKeyExpr.not('A'),
    )!;
    expect(expr.serialize()).toBe('true');
  });

  it('Resolves false constant AND expressions', () => {
    const expr = ContextKeyExpr.and(
      ContextKeyExpr.has('A'),
      ContextKeyExpr.not('A'),
    )!;
    expect(expr.serialize()).toBe('false');
  });

  it('issue #129625: Removes duplicated terms in AND expressions', () => {
    const expr = ContextKeyExpr.and(
      ContextKeyExpr.has('A'),
      ContextKeyExpr.has('B'),
      ContextKeyExpr.has('A'),
    )!;
    expect(expr.serialize()).toBe('A && B');
  });

  it('issue #129625: Remove duplicated terms when negating', () => {
    const expr = ContextKeyExpr.and(
      ContextKeyExpr.has('A'),
      ContextKeyExpr.or(ContextKeyExpr.has('B1'), ContextKeyExpr.has('B2')),
    )!;
    expect(expr.serialize()).toBe('A && B1 || A && B2');
    expect(expr.negate().serialize()).toBe('!A || !A && !B1 || !A && !B2 || !B1 && !B2');
    expect(expr.negate().negate().serialize()).toBe('A && B1 || A && B2');
    expect(expr.negate().negate().negate().serialize()).toBe('!A || !A && !B1 || !A && !B2 || !B1 && !B2');
  });

  it('issue #129625: remove redundant terms in OR expressions', () => {
    function strImplies(p0: string, q0: string): boolean {
      const p = ContextKeyExpr.deserialize(p0)!;
      const q = ContextKeyExpr.deserialize(q0)!;
      return implies(p, q);
    }
    expect(strImplies('a && b', 'a')).toBe(true);
    expect(strImplies('a', 'a && b')).toBe(false);
  });

  it('implies', () => {
    function strImplies(p0: string, q0: string): boolean {
      const p = ContextKeyExpr.deserialize(p0)!;
      const q = ContextKeyExpr.deserialize(q0)!;
      return implies(p, q);
    }
    expect(strImplies('a', 'a')).toBe(true);
    expect(strImplies('a', 'a || b')).toBe(true);
    expect(strImplies('a', 'a && b')).toBe(false);
    expect(strImplies('a', 'a && b || a && c')).toBe(false);
    expect(strImplies('a && b', 'a')).toBe(true);
    expect(strImplies('a && b', 'b')).toBe(true);
    expect(strImplies('a && b', 'a && b || c')).toBe(true);
    expect(strImplies('a || b', 'a || c')).toBe(false);
    expect(strImplies('a || b', 'a || b')).toBe(true);
    expect(strImplies('a && b', 'a && b')).toBe(true);
    expect(strImplies('a || b', 'a || b || c')).toBe(true);
    expect(strImplies('c && a && b', 'c && a')).toBe(true);
  });

  it('Greater, GreaterEquals, Smaller, SmallerEquals evaluate', () => {
    function checkEvaluate(expr: string, ctx: any, expected: any): void {
      const _expr = ContextKeyExpr.deserialize(expr)!;
      expect(_expr.evaluate(createContext(ctx))).toBe(expected);
    }

    checkEvaluate('a > 1', {}, false);
    checkEvaluate('a > 1', { a: 0 }, false);
    checkEvaluate('a > 1', { a: 1 }, false);
    checkEvaluate('a > 1', { a: 2 }, true);
    checkEvaluate('a > 1', { a: '0' }, false);
    checkEvaluate('a > 1', { a: '1' }, false);
    checkEvaluate('a > 1', { a: '2' }, true);
    checkEvaluate('a > 1', { a: 'a' }, false);

    checkEvaluate('a > 10', { a: 2 }, false);
    checkEvaluate('a > 10', { a: 11 }, true);
    checkEvaluate('a > 10', { a: '11' }, true);
    checkEvaluate('a > 10', { a: '2' }, false);
    checkEvaluate('a > 10', { a: '11' }, true);

    checkEvaluate('a > 1.1', { a: 1 }, false);
    checkEvaluate('a > 1.1', { a: 2 }, true);
    checkEvaluate('a > 1.1', { a: 11 }, true);
    checkEvaluate('a > 1.1', { a: '1.1' }, false);
    checkEvaluate('a > 1.1', { a: '2' }, true);
    checkEvaluate('a > 1.1', { a: '11' }, true);

    checkEvaluate('a > b', { a: 'b' }, false);
    checkEvaluate('a > b', { a: 'c' }, false);
    checkEvaluate('a > b', { a: 1000 }, false);

    checkEvaluate('a >= 2', { a: '1' }, false);
    checkEvaluate('a >= 2', { a: '2' }, true);
    checkEvaluate('a >= 2', { a: '3' }, true);

    checkEvaluate('a < 2', { a: '1' }, true);
    checkEvaluate('a < 2', { a: '2' }, false);
    checkEvaluate('a < 2', { a: '3' }, false);

    checkEvaluate('a <= 2', { a: '1' }, true);
    checkEvaluate('a <= 2', { a: '2' }, true);
    checkEvaluate('a <= 2', { a: '3' }, false);
  });

  it('Greater, GreaterEquals, Smaller, SmallerEquals negate', () => {
    function checkNegate(expr: string, expected: string): void {
      const a = ContextKeyExpr.deserialize(expr)!;
      const b = a.negate();
      expect(b.serialize()).toBe(expected);
    }

    checkNegate('a > 1', 'a <= 1');
    checkNegate('a > 1.1', 'a <= 1.1');
    checkNegate('a > b', 'a <= b');

    checkNegate('a >= 1', 'a < 1');
    checkNegate('a >= 1.1', 'a < 1.1');
    checkNegate('a >= b', 'a < b');

    checkNegate('a < 1', 'a >= 1');
    checkNegate('a < 1.1', 'a >= 1.1');
    checkNegate('a < b', 'a >= b');

    checkNegate('a <= 1', 'a > 1');
    checkNegate('a <= 1.1', 'a > 1.1');
    checkNegate('a <= b', 'a > b');
  });

  it('issue #111899: context keys can use `<` or `>` ', () => {
    const actual = ContextKeyExpr.deserialize('editorTextFocus && vim.active && vim.use<C-r>')!;
    expect(
      actual.equals(
        ContextKeyExpr.and(
          ContextKeyExpr.has('editorTextFocus'),
          ContextKeyExpr.has('vim.active'),
          ContextKeyExpr.has('vim.use<C-r>'),
        )!,
      ),
    ).toBe(true);
  });

  it('validateWhenClauses', () => {
    const errors = validateWhenClauses([
      'foo && bar',
      'invalid & bar',
      'missing && &&',
    ]);

    expect(errors[0]).toEqual([]);
    expect(errors[1].length).toBeGreaterThan(0);
    expect(errors[2].length).toBeGreaterThan(0);
  });

  it('expressionsAreEqualWithConstantSubstitution', () => {
    setConstant('myConstant', true);

    const expr1 = ContextKeyExpr.deserialize('myConstant');
    const expr2 = ContextKeyExpr.deserialize('true');

    expect(expressionsAreEqualWithConstantSubstitution(expr1, expr2)).toBe(true);

    const expr3 = ContextKeyExpr.deserialize('!myConstant');
    const expr4 = ContextKeyExpr.deserialize('false');

    expect(expressionsAreEqualWithConstantSubstitution(expr3, expr4)).toBe(true);
  });
});
