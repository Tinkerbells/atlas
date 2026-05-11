import { describe, expect, it } from "vitest";
import { createContext } from "@platform/context/renderer/mock-context-key-service";
import {
  ContextKeyExpr,
  ContextKeyExprType,
  ContextKeyFalseExpr,
  ContextKeyTrueExpr,
  Parser,
} from "@platform/context/renderer/context-key";

function ctx(values: Record<string, unknown>) {
  return createContext(values);
}

describe("contextKeyExpr", () => {
  describe("false()", () => {
    it("evaluates to false", () => {
      const expr = ContextKeyExpr.false();
      expect(expr.evaluate(ctx({}))).toBe(false);
    });

    it("serializes to 'false'", () => {
      expect(ContextKeyExpr.false().serialize()).toBe("false");
    });

    it("negates to true", () => {
      expect(ContextKeyExpr.false().negate()).toBe(ContextKeyTrueExpr.INSTANCE);
    });

    it("has type False", () => {
      expect(ContextKeyExpr.false().type).toBe(ContextKeyExprType.False);
    });
  });

  describe("true()", () => {
    it("evaluates to true", () => {
      const expr = ContextKeyExpr.true();
      expect(expr.evaluate(ctx({}))).toBe(true);
    });

    it("serializes to 'true'", () => {
      expect(ContextKeyExpr.true().serialize()).toBe("true");
    });

    it("negates to false", () => {
      expect(ContextKeyExpr.true().negate()).toBe(ContextKeyFalseExpr.INSTANCE);
    });
  });

  describe("has()", () => {
    it("evaluates to true when key is truthy", () => {
      const expr = ContextKeyExpr.has("foo");
      expect(expr.evaluate(ctx({ foo: true }))).toBe(true);
      expect(expr.evaluate(ctx({ foo: "bar" }))).toBe(true);
    });

    it("evaluates to false when key is missing or falsy", () => {
      const expr = ContextKeyExpr.has("foo");
      expect(expr.evaluate(ctx({}))).toBe(false);
      expect(expr.evaluate(ctx({ foo: false }))).toBe(false);
    });

    it("serializes to key name", () => {
      expect(ContextKeyExpr.has("foo").serialize()).toBe("foo");
    });

    it("keys() returns [key]", () => {
      expect(ContextKeyExpr.has("foo").keys()).toEqual(["foo"]);
    });
  });

  describe("not()", () => {
    it("evaluates to true when key is falsy", () => {
      const expr = ContextKeyExpr.not("foo");
      expect(expr.evaluate(ctx({}))).toBe(true);
      expect(expr.evaluate(ctx({ foo: false }))).toBe(true);
    });

    it("evaluates to false when key is truthy", () => {
      const expr = ContextKeyExpr.not("foo");
      expect(expr.evaluate(ctx({ foo: true }))).toBe(false);
    });

    it("serializes to !key", () => {
      expect(ContextKeyExpr.not("foo").serialize()).toBe("!foo");
    });
  });

  describe("equals()", () => {
    it("evaluates true when value matches", () => {
      const expr = ContextKeyExpr.equals("foo", "bar");
      expect(expr.evaluate(ctx({ foo: "bar" }))).toBe(true);
    });

    it("evaluates false when value does not match", () => {
      const expr = ContextKeyExpr.equals("foo", "bar");
      expect(expr.evaluate(ctx({ foo: "baz" }))).toBe(false);
    });

    it("evaluates false when key is missing", () => {
      const expr = ContextKeyExpr.equals("foo", "bar");
      expect(expr.evaluate(ctx({}))).toBe(false);
    });

    it("equals(key, true) is same as has(key)", () => {
      const expr = ContextKeyExpr.equals("foo", true);
      expect(expr.type).toBe(ContextKeyExprType.Defined);
    });

    it("equals(key, false) is same as not(key)", () => {
      const expr = ContextKeyExpr.equals("foo", false);
      expect(expr.type).toBe(ContextKeyExprType.Not);
    });

    it("serializes with quoted value", () => {
      expect(ContextKeyExpr.equals("foo", "bar").serialize()).toBe("foo == 'bar'");
    });
  });

  describe("notEquals()", () => {
    it("evaluates true when value does not match", () => {
      const expr = ContextKeyExpr.notEquals("foo", "bar");
      expect(expr.evaluate(ctx({ foo: "baz" }))).toBe(true);
      expect(expr.evaluate(ctx({}))).toBe(true);
    });

    it("evaluates false when value matches", () => {
      const expr = ContextKeyExpr.notEquals("foo", "bar");
      expect(expr.evaluate(ctx({ foo: "bar" }))).toBe(false);
    });

    it("serializes correctly", () => {
      expect(ContextKeyExpr.notEquals("foo", "bar").serialize()).toBe("foo != 'bar'");
    });
  });

  describe("regex()", () => {
    it("evaluates true when regex matches", () => {
      const expr = ContextKeyExpr.regex("foo", /docker/);
      expect(expr.evaluate(ctx({ foo: "docker" }))).toBe(true);
      expect(expr.evaluate(ctx({ foo: "my-docker-file" }))).toBe(true);
    });

    it("evaluates false when regex does not match", () => {
      const expr = ContextKeyExpr.regex("foo", /docker/);
      expect(expr.evaluate(ctx({ foo: "node" }))).toBe(false);
    });

    it("serializes with regex", () => {
      const expr = ContextKeyExpr.regex("foo", /docker/i);
      expect(expr.serialize()).toBe("foo =~ /docker/i");
    });
  });

  describe("in()", () => {
    it("evaluates true when value is in array", () => {
      const expr = ContextKeyExpr.in("foo", "barList");
      expect(expr.evaluate(ctx({ foo: "a", barList: ["a", "b", "c"] }))).toBe(true);
    });

    it("evaluates false when value is not in array", () => {
      const expr = ContextKeyExpr.in("foo", "barList");
      expect(expr.evaluate(ctx({ foo: "d", barList: ["a", "b", "c"] }))).toBe(false);
    });

    it("evaluates true when value is a key in object", () => {
      const expr = ContextKeyExpr.in("foo", "barMap");
      expect(expr.evaluate(ctx({ foo: "key1", barMap: { key1: 1, key2: 2 } }))).toBe(true);
    });

    it("serializes correctly", () => {
      expect(ContextKeyExpr.in("foo", "bar").serialize()).toBe("foo in 'bar'");
    });
  });

  describe("notIn()", () => {
    it("evaluates false when value is in array", () => {
      const expr = ContextKeyExpr.notIn("foo", "barList");
      expect(expr.evaluate(ctx({ foo: "a", barList: ["a", "b"] }))).toBe(false);
    });

    it("evaluates true when value is not in array", () => {
      const expr = ContextKeyExpr.notIn("foo", "barList");
      expect(expr.evaluate(ctx({ foo: "z", barList: ["a", "b"] }))).toBe(true);
    });

    it("serializes correctly", () => {
      expect(ContextKeyExpr.notIn("foo", "bar").serialize()).toBe("foo not in 'bar'");
    });
  });

  describe("greater()", () => {
    it("evaluates true when value is greater", () => {
      const expr = ContextKeyExpr.greater("count", 5);
      expect(expr.evaluate(ctx({ count: "10" }))).toBe(true);
    });

    it("evaluates false when value is less or equal", () => {
      const expr = ContextKeyExpr.greater("count", 5);
      expect(expr.evaluate(ctx({ count: "3" }))).toBe(false);
      expect(expr.evaluate(ctx({ count: "5" }))).toBe(false);
    });
  });

  describe("smaller()", () => {
    it("evaluates true when value is smaller", () => {
      const expr = ContextKeyExpr.smaller("count", 5);
      expect(expr.evaluate(ctx({ count: "3" }))).toBe(true);
    });

    it("evaluates false when value is greater or equal", () => {
      const expr = ContextKeyExpr.smaller("count", 5);
      expect(expr.evaluate(ctx({ count: "10" }))).toBe(false);
      expect(expr.evaluate(ctx({ count: "5" }))).toBe(false);
    });
  });

  describe("and()", () => {
    it("evaluates true when all expressions are true", () => {
      const expr = ContextKeyExpr.and(
        ContextKeyExpr.has("a"),
        ContextKeyExpr.equals("b", "1"),
      );
      expect(expr!.evaluate(ctx({ a: true, b: "1" }))).toBe(true);
    });

    it("evaluates false when any expression is false", () => {
      const expr = ContextKeyExpr.and(
        ContextKeyExpr.has("a"),
        ContextKeyExpr.has("b"),
      );
      expect(expr!.evaluate(ctx({ a: true }))).toBe(false);
    });

    it("returns false when any operand is false", () => {
      const expr = ContextKeyExpr.and(
        ContextKeyExpr.has("a"),
        ContextKeyExpr.false(),
      );
      expect(expr).toBe(ContextKeyFalseExpr.INSTANCE);
    });

    it("filters out true operands", () => {
      const expr = ContextKeyExpr.and(
        ContextKeyExpr.true(),
        ContextKeyExpr.has("a"),
      );
      expect(expr!.type).toBe(ContextKeyExprType.Defined);
    });

    it("returns undefined for empty AND", () => {
      expect(ContextKeyExpr.and()).toBeUndefined();
    });

    it("deduplicates identical terms", () => {
      const expr = ContextKeyExpr.and(
        ContextKeyExpr.has("a"),
        ContextKeyExpr.has("a"),
      );
      expect(expr!.type).toBe(ContextKeyExprType.Defined);
    });

    it("detects A && !A and returns false", () => {
      const expr = ContextKeyExpr.and(
        ContextKeyExpr.has("a"),
        ContextKeyExpr.not("a"),
      );
      expect(expr).toBe(ContextKeyFalseExpr.INSTANCE);
    });
  });

  describe("or()", () => {
    it("evaluates true when any expression is true", () => {
      const expr = ContextKeyExpr.or(
        ContextKeyExpr.has("a"),
        ContextKeyExpr.has("b"),
      );
      expect(expr!.evaluate(ctx({ a: true }))).toBe(true);
    });

    it("evaluates false when all expressions are false", () => {
      const expr = ContextKeyExpr.or(
        ContextKeyExpr.has("a"),
        ContextKeyExpr.has("b"),
      );
      expect(expr!.evaluate(ctx({}))).toBe(false);
    });

    it("returns true when any operand is true", () => {
      const expr = ContextKeyExpr.or(
        ContextKeyExpr.has("a"),
        ContextKeyExpr.true(),
      );
      expect(expr).toBe(ContextKeyTrueExpr.INSTANCE);
    });

    it("filters out false operands", () => {
      const expr = ContextKeyExpr.or(
        ContextKeyExpr.false(),
        ContextKeyExpr.has("a"),
      );
      expect(expr!.type).toBe(ContextKeyExprType.Defined);
    });

    it("detects A || !A and returns true", () => {
      const expr = ContextKeyExpr.or(
        ContextKeyExpr.has("a"),
        ContextKeyExpr.not("a"),
      );
      expect(expr).toBe(ContextKeyTrueExpr.INSTANCE);
    });
  });

  describe("negate()", () => {
    it("negate round-trips for simple expressions", () => {
      const expr = ContextKeyExpr.has("foo");
      const negated = expr.negate();
      const doubleNegated = negated.negate();
      expect(doubleNegated.equals(expr)).toBe(true);
    });

    it("negate of equals is notEquals", () => {
      const expr = ContextKeyExpr.equals("foo", "bar");
      const negated = expr.negate();
      expect(negated.type).toBe(ContextKeyExprType.NotEquals);
    });

    it("negate of notEquals is equals", () => {
      const expr = ContextKeyExpr.notEquals("foo", "bar");
      const negated = expr.negate();
      expect(negated.type).toBe(ContextKeyExprType.Equals);
    });

    it("negate of greater is smallerEquals", () => {
      const expr = ContextKeyExpr.greater("x", 5);
      const negated = expr.negate();
      expect(negated.type).toBe(ContextKeyExprType.SmallerEquals);
    });
  });

  describe("equals() — structural equality", () => {
    it("same expressions are equal", () => {
      const a = ContextKeyExpr.equals("foo", "bar");
      const b = ContextKeyExpr.equals("foo", "bar");
      expect(a.equals(b)).toBe(true);
    });

    it("different expressions are not equal", () => {
      const a = ContextKeyExpr.equals("foo", "bar");
      const b = ContextKeyExpr.equals("foo", "baz");
      expect(a.equals(b)).toBe(false);
    });

    it("different types are not equal", () => {
      const a = ContextKeyExpr.has("foo");
      const b = ContextKeyExpr.not("foo");
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("deserialize()", () => {
    it("deserializes simple has", () => {
      const expr = ContextKeyExpr.deserialize("foo");
      expect(expr!.type).toBe(ContextKeyExprType.Defined);
      expect(expr!.serialize()).toBe("foo");
    });

    it("deserializes equals", () => {
      const expr = ContextKeyExpr.deserialize("foo == bar");
      expect(expr!.type).toBe(ContextKeyExprType.Equals);
    });

    it("deserializes notEquals", () => {
      const expr = ContextKeyExpr.deserialize("foo != bar");
      expect(expr!.type).toBe(ContextKeyExprType.NotEquals);
    });

    it("deserializes AND expression", () => {
      const expr = ContextKeyExpr.deserialize("a && b");
      expect(expr!.type).toBe(ContextKeyExprType.And);
    });

    it("deserializes OR expression", () => {
      const expr = ContextKeyExpr.deserialize("a || b");
      expect(expr!.type).toBe(ContextKeyExprType.Or);
    });

    it("deserializes NOT expression", () => {
      const expr = ContextKeyExpr.deserialize("!foo");
      expect(expr!.type).toBe(ContextKeyExprType.Not);
    });

    it("deserializes true/false", () => {
      expect(ContextKeyExpr.deserialize("true")).toBe(ContextKeyTrueExpr.INSTANCE);
      expect(ContextKeyExpr.deserialize("false")).toBe(ContextKeyFalseExpr.INSTANCE);
    });

    it("deserializes regex", () => {
      const expr = ContextKeyExpr.deserialize("foo =~ /bar/");
      expect(expr!.type).toBe(ContextKeyExprType.Regex);
    });

    it("deserializes in expression", () => {
      const expr = ContextKeyExpr.deserialize("foo in barList");
      expect(expr!.type).toBe(ContextKeyExprType.In);
    });

    it("deserializes not in expression", () => {
      const expr = ContextKeyExpr.deserialize("foo not in barList");
      expect(expr!.type).toBe(ContextKeyExprType.NotIn);
    });

    it("returns undefined for null/undefined input", () => {
      expect(ContextKeyExpr.deserialize(null)).toBeUndefined();
      expect(ContextKeyExpr.deserialize(undefined)).toBeUndefined();
    });

    it("optimizes foo == true to defined", () => {
      const expr = ContextKeyExpr.deserialize("foo == true");
      expect(expr!.type).toBe(ContextKeyExprType.Defined);
    });

    it("optimizes foo != false to defined", () => {
      const expr = ContextKeyExpr.deserialize("foo != false");
      expect(expr!.type).toBe(ContextKeyExprType.Defined);
    });

    it("optimizes foo == false to not", () => {
      const expr = ContextKeyExpr.deserialize("foo == false");
      expect(expr!.type).toBe(ContextKeyExprType.Not);
    });
  });
});

describe("parser", () => {
  it("reports error for empty string", () => {
    const parser = new Parser();
    const result = parser.parse("");
    expect(result).toBeUndefined();
    expect(parser.parsingErrors).toHaveLength(1);
    expect(parser.parsingErrors[0].message).toContain("Empty");
  });

  it("reports error for unexpected token", () => {
    const parser = new Parser();
    const result = parser.parse("== foo");
    expect(result).toBeUndefined();
    expect(parser.parsingErrors.length).toBeGreaterThan(0);
  });

  it("reports error for missing closing paren", () => {
    const parser = new Parser();
    const result = parser.parse("(foo && bar");
    expect(result).toBeUndefined();
  });

  it("parses parenthesized expression", () => {
    const expr = ContextKeyExpr.deserialize("(foo)");
    expect(expr!.type).toBe(ContextKeyExprType.Defined);
  });

  it("parses complex expression", () => {
    const expr = ContextKeyExpr.deserialize("a == '1' && (b || !c)");
    expect(expr).toBeDefined();
    expect(expr!.evaluate(ctx({ a: "1", b: true }))).toBe(true);
    expect(expr!.evaluate(ctx({ a: "1", b: false, c: true }))).toBe(false);
    expect(expr!.evaluate(ctx({ a: "1", b: false, c: false }))).toBe(true);
  });
});
