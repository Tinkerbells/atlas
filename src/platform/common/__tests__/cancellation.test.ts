import { describe, expect, it } from "vitest";
import { CancellationToken, CancellationTokenSource } from "@platform/common/cancellation";

describe("cancellationToken", () => {
  describe("none", () => {
    it("is not cancelled", () => {
      expect(CancellationToken.None.isCancellationRequested).toBe(false);
      expect(typeof CancellationToken.None.onCancellationRequested).toBe("function");
    });
  });

  describe("cancel before token", () => {
    it("sets isCancellationRequested and fires event", async () => {
      const source = new CancellationTokenSource();
      expect(source.token.isCancellationRequested).toBe(false);
      source.cancel();

      expect(source.token.isCancellationRequested).toBe(true);

      await new Promise<void>((resolve) => {
        source.token.onCancellationRequested(() => resolve());
      });
    });
  });

  describe("cancel happens only once", () => {
    it("fires event only once", () => {
      const source = new CancellationTokenSource();
      let cancelCount = 0;
      source.token.onCancellationRequested(() => cancelCount++);

      source.cancel();
      source.cancel();

      expect(cancelCount).toBe(1);
    });
  });

  describe("cancel calls all listeners", () => {
    it("notifies all subscribers", () => {
      let count = 0;
      const source = new CancellationTokenSource();
      source.token.onCancellationRequested(() => count++);
      source.token.onCancellationRequested(() => count++);
      source.token.onCancellationRequested(() => count++);

      source.cancel();
      expect(count).toBe(3);
    });
  });

  describe("token stays the same", () => {
    it("returns same token instance", () => {
      let source = new CancellationTokenSource();
      let token = source.token;
      expect(token).toBe(source.token);

      source.cancel();
      expect(token).toBe(source.token);

      source = new CancellationTokenSource();
      source.cancel();
      token = source.token;
      expect(token).toBe(source.token);
    });
  });

  describe("dispose calls no listeners", () => {
    it("prevents cancellation event after dispose", () => {
      let count = 0;
      const source = new CancellationTokenSource();
      source.token.onCancellationRequested(() => count++);

      source.dispose();
      source.cancel();
      expect(count).toBe(0);
    });
  });

  describe("dispose calls no listeners (unless told to cancel)", () => {
    it("cancels when dispose(true)", () => {
      let count = 0;
      const source = new CancellationTokenSource();
      source.token.onCancellationRequested(() => count++);

      source.dispose(true);
      expect(count).toBe(1);
    });
  });

  describe("dispose does not cancel", () => {
    it("leaves token uncancelled", () => {
      const source = new CancellationTokenSource();
      source.dispose();
      expect(source.token.isCancellationRequested).toBe(false);
    });
  });

  describe("parent cancels child", () => {
    it("propagates cancellation to child source", () => {
      const parent = new CancellationTokenSource();
      const child = new CancellationTokenSource(parent.token);

      let count = 0;
      child.token.onCancellationRequested(() => count++);

      parent.cancel();

      expect(count).toBe(1);
      expect(child.token.isCancellationRequested).toBe(true);
      expect(parent.token.isCancellationRequested).toBe(true);

      child.dispose();
      parent.dispose();
    });
  });
});
