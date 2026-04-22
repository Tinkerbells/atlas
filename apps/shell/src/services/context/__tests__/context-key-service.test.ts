import { describe, expect, it } from "vitest";

import { Context, ContextKeyService } from "../context-key-service";

describe("context", () => {
  it("sets and gets a value", () => {
    const ctx = new Context(1, null);
    ctx.setValue("foo", "bar");
    expect(ctx.getValue("foo")).toBe("bar");
  });

  it("returns undefined for missing key", () => {
    const ctx = new Context(1, null);
    expect(ctx.getValue("missing")).toBeUndefined();
  });

  it("removeValue deletes a key", () => {
    const ctx = new Context(1, null);
    ctx.setValue("foo", "bar");
    expect(ctx.removeValue("foo")).toBe(true);
    expect(ctx.getValue("foo")).toBeUndefined();
  });

  it("removeValue returns false for missing key", () => {
    const ctx = new Context(1, null);
    expect(ctx.removeValue("nope")).toBe(false);
  });

  it("setValue returns true when value changes", () => {
    const ctx = new Context(1, null);
    expect(ctx.setValue("foo", 1)).toBe(true);
    expect(ctx.setValue("foo", 2)).toBe(true);
  });

  it("setValue returns false when value is the same", () => {
    const ctx = new Context(1, null);
    ctx.setValue("foo", 1);
    expect(ctx.setValue("foo", 1)).toBe(false);
  });

  it("inherits values from parent", () => {
    const parent = new Context(1, null);
    parent.setValue("inherited", "yes");
    const child = new Context(2, parent);
    expect(child.getValue("inherited")).toBe("yes");
  });

  it("child overrides parent value", () => {
    const parent = new Context(1, null);
    parent.setValue("key", "parent");
    const child = new Context(2, parent);
    child.setValue("key", "child");
    expect(child.getValue("key")).toBe("child");
  });

  it("collectAllValues merges parent and child", () => {
    const parent = new Context(1, null);
    parent.setValue("a", 1);
    const child = new Context(2, parent);
    child.setValue("b", 2);
    const all = child.collectAllValues();
    expect(all.a).toBe(1);
    expect(all.b).toBe(2);
  });

  it("collectAllValues does not include _contextId", () => {
    const ctx = new Context(1, null);
    const all = ctx.collectAllValues();
    expect("_contextId" in all).toBe(false);
  });

  it("updateParent changes the parent", () => {
    const parent1 = new Context(1, null);
    parent1.setValue("key", "p1");
    const parent2 = new Context(2, null);
    parent2.setValue("key", "p2");
    const child = new Context(3, parent1);
    expect(child.getValue("key")).toBe("p1");
    child.updateParent(parent2);
    expect(child.getValue("key")).toBe("p2");
  });
});

describe("contextKeyService", () => {
  it("creates a context key and sets a value", () => {
    const service = new ContextKeyService();
    const key = service.createKey<string>("testKey", undefined);
    key.set("hello");
    expect(service.getContextKeyValue("testKey")).toBe("hello");
  });

  it("resets to default value", () => {
    const service = new ContextKeyService();
    const key = service.createKey<string>("testKey", "default");
    key.set("changed");
    expect(service.getContextKeyValue("testKey")).toBe("changed");
    key.reset();
    expect(service.getContextKeyValue("testKey")).toBe("default");
  });

  it("reset with undefined default removes the key", () => {
    const service = new ContextKeyService();
    const key = service.createKey<string>("testKey", undefined);
    key.set("value");
    key.reset();
    expect(service.getContextKeyValue("testKey")).toBeUndefined();
  });

  it("contextMatchesRules evaluates expression", () => {
    const service = new ContextKeyService();
    const key = service.createKey<boolean>("myFlag", false);

    expect(service.contextMatchesRules({ type: 2, evaluate: () => false, serialize: () => "", keys: () => [], equals: () => false, cmp: () => 0, map: (_f: any) => ({ type: 2, evaluate: () => false, serialize: () => "", keys: () => [], equals: () => false, cmp: () => 0, map: (_f2: any) => ({} as any), negate: () => ({} as any), substituteConstants: () => undefined }), negate: () => ({} as any), substituteConstants: () => undefined } as any)).toBe(false);

    key.set(true);
    expect(service.getContextKeyValue("myFlag")).toBe(true);
  });

  it("createChildContext creates a new context", () => {
    const service = new ContextKeyService();
    const _parentId = service.contextId;
    service.setContext("parentKey", "parentVal");

    const childId = service.createChildContext();
    const childCtx = service.getContextValuesContainer(childId);
    expect(childCtx.getValue("parentKey")).toBe("parentVal");
  });

  it("disposeContext removes a child context", () => {
    const service = new ContextKeyService();
    const childId = service.createChildContext();
    service.disposeContext(childId);
    const childCtx = service.getContextValuesContainer(childId);
    expect(childCtx.getValue("anything")).toBeUndefined();
  });

  it("createScoped creates a scoped service", () => {
    const service = new ContextKeyService();
    const domNode = {
      parentElement: null,
      setAttribute: () => {},
      removeAttribute: () => {},
      hasAttribute: () => false,
      getAttribute: () => null,
    };
    const scoped = service.createScoped(domNode);
    expect(scoped).toBeDefined();
    scoped.dispose();
  });

  it("dispose marks service as disposed", () => {
    const service = new ContextKeyService();
    service.dispose();
    expect(() => service.createKey("x", undefined)).toThrow("disposed");
  });

  it("get() returns current value from context key", () => {
    const service = new ContextKeyService();
    const key = service.createKey<string>("myKey", undefined);
    expect(key.get()).toBeUndefined();
    key.set("hello");
    expect(key.get()).toBe("hello");
  });
});
