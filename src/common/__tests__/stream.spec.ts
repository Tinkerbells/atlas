import { describe, expect, it } from "vitest";

import { newWriteableStream } from "~/common/stream";

describe("newWriteableStream", () => {
  it("emits data events", () => {
    const stream = newWriteableStream<number>(data => data.reduce((a, b) => a + b, 0));
    const received: number[] = [];

    stream.on("data", data => received.push(data));
    stream.write(1);
    stream.write(2);
    stream.write(3);

    expect(received).toEqual([1, 2, 3]);
  });

  it("emits end event", () => {
    const stream = newWriteableStream<number>(data => data.reduce((a, b) => a + b, 0));
    let ended = false;

    stream.on("end", () => {
      ended = true;
    });
    stream.end();

    expect(ended).toBe(true);
    expect(stream.destroyed).toBe(true);
  });

  it("emits error event", () => {
    const stream = newWriteableStream<number>(data => data.reduce((a, b) => a + b, 0));
    let error: Error | undefined;

    stream.on("error", (err) => {
      error = err;
    });
    stream.error(new Error("test error"));

    expect(error).toBeDefined();
    expect(error!.message).toBe("test error");
    expect(stream.destroyed).toBe(true);
  });

  it("ignores write after end", () => {
    const stream = newWriteableStream<number>(data => data.reduce((a, b) => a + b, 0));
    const received: number[] = [];

    stream.on("data", data => received.push(data));
    stream.end();
    stream.write(42);

    expect(received).toEqual([]);
  });

  it("ignores write after error", () => {
    const stream = newWriteableStream<number>(data => data.reduce((a, b) => a + b, 0));
    const received: number[] = [];

    stream.on("data", data => received.push(data));
    stream.error(new Error("boom"));
    stream.write(42);

    expect(received).toEqual([]);
  });
});
