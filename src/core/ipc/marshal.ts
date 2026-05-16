import { VSBuffer } from "@core/base/buffer";
import { URI } from "@platform/common/uri/uri";

const URI_MARKER = "$uri";
const VSBUFFER_MARKER = "$vsbuffer";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object"
    && value !== null
    && Object.getPrototypeOf(value) === Object.prototype;
}

export function marshal(value: unknown): unknown {
  if (value instanceof URI || URI.isUri(value)) {
    return {
      [URI_MARKER]: true,
      scheme: value.scheme,
      authority: value.authority,
      path: value.path,
      query: value.query,
      fragment: value.fragment,
    };
  }

  if (value instanceof VSBuffer) {
    return {
      [VSBUFFER_MARKER]: true,
      data: value.buffer,
    };
  }

  if (Array.isArray(value)) {
    return value.map(marshal);
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      result[key] = marshal(value[key]);
    }
    return result;
  }

  return value;
}

export function unmarshal(value: unknown): unknown {
  if (isPlainObject(value) && value[URI_MARKER] === true) {
    return URI.from({
      scheme: String(value.scheme ?? ""),
      authority: String(value.authority ?? ""),
      path: String(value.path ?? ""),
      query: String(value.query ?? ""),
      fragment: String(value.fragment ?? ""),
    });
  }

  if (isPlainObject(value) && value[VSBUFFER_MARKER] === true) {
    return VSBuffer.wrap(value.data as Uint8Array);
  }

  if (Array.isArray(value)) {
    return value.map(unmarshal);
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      result[key] = unmarshal(value[key]);
    }
    return result;
  }

  return value;
}
