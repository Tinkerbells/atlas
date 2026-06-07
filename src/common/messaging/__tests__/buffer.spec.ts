import { describe, expect, it } from "vitest";

import { Uint8ArrayReadBuffer, Uint8ArrayWriteBuffer } from "~/common/messaging/buffer";

describe("uint8ArrayWriteBuffer", () => {
  it("writes and reads Uint8", () => {
    const writer = new Uint8ArrayWriteBuffer();
    writer.writeUint8(42);
    writer.commit();

    const reader = new Uint8ArrayReadBuffer(writer.getCurrentContents());
    expect(reader.readUint8()).toBe(42);
  });

  it("writes and reads Uint16", () => {
    const writer = new Uint8ArrayWriteBuffer();
    writer.writeUint16(0xABCD);
    writer.commit();

    const reader = new Uint8ArrayReadBuffer(writer.getCurrentContents());
    expect(reader.readUint16()).toBe(0xABCD);
  });

  it("writes and reads Uint32", () => {
    const writer = new Uint8ArrayWriteBuffer();
    writer.writeUint32(0xDEADBEEF);
    writer.commit();

    const reader = new Uint8ArrayReadBuffer(writer.getCurrentContents());
    expect(reader.readUint32()).toBe(0xDEADBEEF);
  });

  it("writes and reads float64 number", () => {
    const writer = new Uint8ArrayWriteBuffer();
    writer.writeNumber(Math.PI);
    writer.commit();

    const reader = new Uint8ArrayReadBuffer(writer.getCurrentContents());
    expect(reader.readNumber()).toBe(Math.PI);
  });

  it("writes and reads string", () => {
    const writer = new Uint8ArrayWriteBuffer();
    writer.writeString("hello world");
    writer.commit();

    const reader = new Uint8ArrayReadBuffer(writer.getCurrentContents());
    expect(reader.readString()).toBe("hello world");
  });

  it("writes and reads bytes", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const writer = new Uint8ArrayWriteBuffer();
    writer.writeBytes(data);
    writer.commit();

    const reader = new Uint8ArrayReadBuffer(writer.getCurrentContents());
    expect(reader.readBytes()).toEqual(data);
  });

  it("writes and reads length with variable-length encoding", () => {
    const writer = new Uint8ArrayWriteBuffer();
    writer.writeLength(1000);
    writer.commit();

    const reader = new Uint8ArrayReadBuffer(writer.getCurrentContents());
    expect(reader.readLength()).toBe(1000);
  });

  it("auto-expands buffer capacity", () => {
    const writer = new Uint8ArrayWriteBuffer(new Uint8Array(2));
    writer.writeString("this is a long string that exceeds initial capacity");
    writer.commit();

    const reader = new Uint8ArrayReadBuffer(writer.getCurrentContents());
    expect(reader.readString()).toBe("this is a long string that exceeds initial capacity");
  });

  it("fires onCommit event", () => {
    const writer = new Uint8ArrayWriteBuffer();
    let committed: Uint8Array | undefined;
    writer.onCommit((data) => {
      committed = data;
    });
    writer.writeUint8(99);
    writer.commit();

    expect(committed).toBeDefined();
    expect(committed!.byteLength).toBeGreaterThan(0);
  });

  it("throws on commit after dispose", () => {
    const writer = new Uint8ArrayWriteBuffer();
    writer.commit();
    expect(() => writer.commit()).toThrow("already disposed");
  });
});

describe("uint8ArrayReadBuffer", () => {
  it("reads multiple values in sequence", () => {
    const writer = new Uint8ArrayWriteBuffer();
    writer.writeUint8(1);
    writer.writeUint16(2);
    writer.writeUint32(3);
    writer.writeNumber(4.5);
    writer.writeString("test");
    writer.commit();

    const reader = new Uint8ArrayReadBuffer(writer.getCurrentContents());
    expect(reader.readUint8()).toBe(1);
    expect(reader.readUint16()).toBe(2);
    expect(reader.readUint32()).toBe(3);
    expect(reader.readNumber()).toBe(4.5);
    expect(reader.readString()).toBe("test");
  });

  it("sliceAtReadPosition creates independent reader", () => {
    const writer = new Uint8ArrayWriteBuffer();
    writer.writeUint8(1);
    writer.writeUint8(2);
    writer.commit();

    const reader = new Uint8ArrayReadBuffer(writer.getCurrentContents());
    reader.readUint8(); // skip first byte
    const sliced = reader.sliceAtReadPosition();
    expect(sliced.readUint8()).toBe(2);
  });
});
