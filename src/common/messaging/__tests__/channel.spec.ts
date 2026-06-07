import { describe, expect, it, vi } from "vitest";

import { Uint8ArrayReadBuffer, Uint8ArrayWriteBuffer } from "~/common/messaging/buffer";
import { AbstractChannel, ChannelMultiplexer, MessageTypes } from "~/common/messaging/channel";

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

describe("channelMultiplexer", () => {
  it("opens a channel and acknowledges", async () => {
    const underlying = new TestChannel();
    const multiplexer = new ChannelMultiplexer(underlying);

    const openPromise = multiplexer.open("test-channel");

    underlying.simulateReceive(
      new Uint8ArrayWriteBuffer()
        .writeUint8(MessageTypes.AckOpen)
        .writeString("test-channel")
        .getCurrentContents(),
    );

    const channel = await openPromise;
    expect(channel).toBeDefined();

    multiplexer.dispose();
  });

  it("receives data on opened channel", async () => {
    const underlying = new TestChannel();
    const multiplexer = new ChannelMultiplexer(underlying);

    const openPromise = multiplexer.open("test-channel");
    underlying.simulateReceive(
      new Uint8ArrayWriteBuffer()
        .writeUint8(MessageTypes.AckOpen)
        .writeString("test-channel")
        .getCurrentContents(),
    );
    const channel = await openPromise;

    const messageHandler = vi.fn();
    channel.onMessage((provider) => {
      const buffer = provider();
      messageHandler(buffer.readUint8());
    });

    underlying.simulateReceive(
      new Uint8ArrayWriteBuffer()
        .writeUint8(MessageTypes.Data)
        .writeString("test-channel")
        .writeUint8(42)
        .getCurrentContents(),
    );

    expect(messageHandler).toHaveBeenCalledWith(42);

    multiplexer.dispose();
  });

  it("closes channel and notifies remote", async () => {
    const underlying = new TestChannel();
    const multiplexer = new ChannelMultiplexer(underlying);

    const sentBuffers: Uint8Array[] = [];
    underlying.onSend(buffer => sentBuffers.push(buffer));

    const openPromise = multiplexer.open("test-channel");
    underlying.simulateReceive(
      new Uint8ArrayWriteBuffer()
        .writeUint8(MessageTypes.AckOpen)
        .writeString("test-channel")
        .getCurrentContents(),
    );
    const channel = await openPromise;

    channel.close();

    expect(sentBuffers.length).toBeGreaterThanOrEqual(1);

    multiplexer.dispose();
  });

  it("throws when opening duplicate channel", async () => {
    const underlying = new TestChannel();
    const multiplexer = new ChannelMultiplexer(underlying);

    const openPromise = multiplexer.open("test-channel");
    underlying.simulateReceive(
      new Uint8ArrayWriteBuffer()
        .writeUint8(MessageTypes.AckOpen)
        .writeString("test-channel")
        .getCurrentContents(),
    );
    await openPromise;

    expect(() => multiplexer.open("test-channel")).toThrow("already open");

    multiplexer.dispose();
  });

  it("handles remote close", async () => {
    const underlying = new TestChannel();
    const multiplexer = new ChannelMultiplexer(underlying);

    const openPromise = multiplexer.open("test-channel");
    underlying.simulateReceive(
      new Uint8ArrayWriteBuffer()
        .writeUint8(MessageTypes.AckOpen)
        .writeString("test-channel")
        .getCurrentContents(),
    );
    const channel = await openPromise;

    const closeHandler = vi.fn();
    channel.onClose(event => closeHandler(event.reason));

    underlying.simulateReceive(
      new Uint8ArrayWriteBuffer()
        .writeUint8(MessageTypes.Close)
        .writeString("test-channel")
        .getCurrentContents(),
    );

    expect(closeHandler).toHaveBeenCalledWith("Channel has been closed from the remote side");

    multiplexer.dispose();
  });
});
