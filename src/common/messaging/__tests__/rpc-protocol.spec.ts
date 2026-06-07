import { describe, expect, it } from "vitest";

import { AbstractChannel } from "~/common/messaging/channel";
import { BatchingChannel } from "~/common/messaging/rpc-protocol";
import { Uint8ArrayReadBuffer, Uint8ArrayWriteBuffer } from "~/common/messaging/buffer";

class TestChannel extends AbstractChannel {
  private sendHandler?: (buffer: Uint8Array) => void;

  simulateReceive(data: Uint8Array): void {
    this.onMessageEmitter.fire(() => new Uint8ArrayReadBuffer(data));
  }

  getWriteBuffer() {
    const writer = new Uint8ArrayWriteBuffer();
    writer.onCommit((buffer) => {
      this.sendHandler?.(buffer);
    });
    return writer;
  }

  onSend(handler: (buffer: Uint8Array) => void): void {
    this.sendHandler = handler;
  }
}

describe("batchingChannel", () => {
  it("batches multiple messages into single send", async () => {
    const underlying = new TestChannel();
    const batching = new BatchingChannel(underlying);

    const sentBuffers: Uint8Array[] = [];
    underlying.onSend(buffer => sentBuffers.push(buffer));

    const writer1 = batching.getWriteBuffer();
    writer1.writeUint8(1).commit();

    const writer2 = batching.getWriteBuffer();
    writer2.writeUint8(2).commit();

    // Wait for microtask flush
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(sentBuffers.length).toBe(1);
    const reader = new Uint8ArrayReadBuffer(sentBuffers[0]);
    expect(reader.readLength()).toBe(2); // 2 batched messages
    expect(reader.readBytes().byteLength).toBeGreaterThan(0);
    expect(reader.readBytes().byteLength).toBeGreaterThan(0);
  });
});
