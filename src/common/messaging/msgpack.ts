import { addExtension, Packr, Unpackr } from "msgpackr";

import { URI } from "../fs/uri";

// Extension type tags (must be < 100 for msgpackr)
const EXT_URI = 1;
const EXT_ERROR = 2;

addExtension({
  Class: URI,
  type: EXT_URI,
  pack(instance: URI): Uint8Array {
    return new TextEncoder().encode(instance.toString());
  },
  unpack(buffer: Uint8Array): URI {
    return new URI(new TextDecoder().decode(buffer));
  },
});

addExtension({
  Class: Error,
  type: EXT_ERROR,
  pack(instance: Error): Uint8Array {
    const data = JSON.stringify({
      name: instance.name,
      message: instance.message,
      stack: instance.stack,
    });
    return new TextEncoder().encode(data);
  },
  unpack(buffer: Uint8Array): Error {
    const { name, message, stack } = JSON.parse(new TextDecoder().decode(buffer));
    const error = new Error(message);
    error.name = name;
    error.stack = stack;
    return error;
  },
});

const packr = new Packr({
  moreTypes: true,
  encodeUndefinedAsNil: false,
  bundleStrings: false,
  useRecords: false,
});

const unpackr = new Unpackr({
  moreTypes: true,
  encodeUndefinedAsNil: false,
  bundleStrings: false,
  useRecords: false,
});

export function encode(data: unknown): Uint8Array {
  return packr.pack(data);
}

export function decode<T = unknown>(buffer: Uint8Array): T {
  return unpackr.unpack(buffer) as T;
}

export { Packr, Unpackr };
