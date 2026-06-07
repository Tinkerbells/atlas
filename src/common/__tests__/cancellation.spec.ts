import { describe, expect, it } from "vitest";

import { CancellationToken, CancellationTokenSource } from "~/common/cancellation";

describe("cancellationTokenSource", () => {
  it("starts not cancelled", () => {
    const source = new CancellationTokenSource();
    expect(source.isCancellationRequested).toBe(false);
  });

  it("becomes cancelled after cancel()", () => {
    const source = new CancellationTokenSource();
    source.cancel();
    expect(source.isCancellationRequested).toBe(true);
  });

  it("fires cancellation listeners", () => {
    const source = new CancellationTokenSource();
    let fired = false;

    source.onCancellationRequested(() => {
      fired = true;
    });
    source.cancel();

    expect(fired).toBe(true);
  });

  it("allows disposing listener", () => {
    const source = new CancellationTokenSource();
    let fired = false;

    const listener = source.onCancellationRequested(() => {
      fired = true;
    });
    listener.dispose();
    source.cancel();

    expect(fired).toBe(false);
  });

  it("does not double-fire listeners", () => {
    const source = new CancellationTokenSource();
    let count = 0;

    source.onCancellationRequested(() => {
      count++;
    });
    source.cancel();
    source.cancel();

    expect(count).toBe(1);
  });
});

describe("cancellationToken.None", () => {
  it("is never cancelled", () => {
    expect(CancellationToken.None.isCancellationRequested).toBe(false);
  });
});
