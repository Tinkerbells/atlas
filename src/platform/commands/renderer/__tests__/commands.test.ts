import { describe, expect, it } from "vitest";
import { CommandRegistry } from "@platform/commands/renderer/commands";
import { createTrackingLogger } from "@platform/logger/renderer/mock-logger";
import { CommandService } from "@platform/commands/renderer/commands-service";

describe("commandRegistry", () => {
  function createRegistry() {
    const { logger, calls } = createTrackingLogger();
    return { registry: new CommandRegistry(logger), logger, calls };
  }

  it("registers a command and retrieves it", () => {
    const { registry } = createRegistry();
    const handler = () => {};
    registry.registerCommand("cmd.a", handler);

    const cmd = registry.getCommand("cmd.a");
    expect(cmd).toBeDefined();
    expect(cmd!.id).toBe("cmd.a");
    expect(cmd!.handler).toBe(handler);
  });

  it("returns undefined for unregistered command", () => {
    const { registry } = createRegistry();
    expect(registry.getCommand("nonexistent")).toBeUndefined();
  });

  it("dispose unregisters the command", () => {
    const { registry } = createRegistry();
    const disposable = registry.registerCommand("cmd.a", () => {});
    disposable.dispose();
    expect(registry.getCommand("cmd.a")).toBeUndefined();
  });

  it("warns when registering duplicate command id", () => {
    const { logger, calls } = createTrackingLogger();
    const registry = new CommandRegistry(logger);
    registry.registerCommand("cmd.dup", () => {});
    registry.registerCommand("cmd.dup", () => {});

    expect(calls.warning).toHaveLength(1);
    expect(calls.warning[0].message).toContain("cmd.dup");
  });

  it("duplicate registration returns no-op disposable", () => {
    const { registry } = createRegistry();
    registry.registerCommand("cmd.dup", () => {});
    const d2 = registry.registerCommand("cmd.dup", () => {});

    const original = registry.getCommand("cmd.dup")!;
    d2.dispose();
    expect(registry.getCommand("cmd.dup")).toBe(original);
  });

  it("allows re-registration after dispose", () => {
    const { registry } = createRegistry();
    const handler1 = () => {};
    const handler2 = () => {};
    registry.registerCommand("cmd.a", handler1).dispose();
    registry.registerCommand("cmd.a", handler2);

    expect(registry.getCommand("cmd.a")!.handler).toBe(handler2);
  });

  it("handles multiple independent commands", () => {
    const { registry } = createRegistry();
    const h1 = () => {};
    const h2 = () => {};
    registry.registerCommand("cmd.1", h1);
    registry.registerCommand("cmd.2", h2);

    expect(registry.getCommand("cmd.1")!.handler).toBe(h1);
    expect(registry.getCommand("cmd.2")!.handler).toBe(h2);
  });
});

describe("commandService", () => {
  function createService() {
    const { logger, calls: logCalls } = createTrackingLogger();
    const registry = new CommandRegistry(logger);
    const service = new CommandService(registry, logger);
    return { registry, service, logger, logCalls };
  }

  it("executes a registered command", async () => {
    const { registry, service } = createService();
    let called = false;
    registry.registerCommand("cmd.run", () => {
      called = true;
    });

    await service.executeCommand("cmd.run");
    expect(called).toBe(true);
  });

  it("passes args to handler", async () => {
    const { registry, service } = createService();
    const received: unknown[] = [];
    registry.registerCommand("cmd.args", (...args: unknown[]) => {
      received.push(...args);
    });

    await service.executeCommand("cmd.args", 1, "hello", true);
    expect(received).toEqual([1, "hello", true]);
  });

  it("returns handler result", async () => {
    const { registry, service } = createService();
    registry.registerCommand("cmd.ret", () => 42);

    const result = await service.executeCommand<number>("cmd.ret");
    expect(result).toBe(42);
  });

  it("rejects when command not found", async () => {
    const { service } = createService();
    await expect(service.executeCommand("missing")).rejects.toThrow("command 'missing' not found");
  });

  it("rejects when handler throws", async () => {
    const { registry, service } = createService();
    registry.registerCommand("cmd.err", () => {
      throw new Error("boom");
    });

    await expect(service.executeCommand("cmd.err")).rejects.toThrow("boom");
  });

  it("wraps non-Error throws", async () => {
    const { registry, service } = createService();
    registry.registerCommand("cmd.str", () => {
      throw new Error("string error");
    });

    await expect(service.executeCommand("cmd.str")).rejects.toThrow("string error");
  });

  it("logs when logging is enabled", async () => {
    const { registry, service, logCalls } = createService();
    registry.registerCommand("cmd.log", () => {});
    service.toggleLogging();

    await service.executeCommand("cmd.log");
    expect(logCalls.info.length).toBeGreaterThan(0);
    expect(logCalls.info[0].message).toContain("cmd.log");
  });

  it("does not log when logging is disabled (default)", async () => {
    const { registry, service, logCalls } = createService();
    registry.registerCommand("cmd.quiet", () => {});

    await service.executeCommand("cmd.quiet");
    expect(logCalls.info).toHaveLength(0);
  });

  it("toggleLogging returns the new state", () => {
    const { service } = createService();
    expect(service.toggleLogging()).toBe(true);
    expect(service.toggleLogging()).toBe(false);
    expect(service.toggleLogging()).toBe(true);
  });
});
