import { isWindows } from "./platform.js";

const sep = isWindows ? "\\" : "/";
const sepPosix = "/";

function normalizeSeparators(path: string): string {
  return path.replace(/\\/g, "/");
}

export function basename(path: string, suffix?: string): string {
  const normalized = normalizeSeparators(path);
  const lastSlash = normalized.lastIndexOf("/");
  let name = lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);

  if (suffix && name.endsWith(suffix)) {
    name = name.slice(0, name.length - suffix.length);
  }

  return name || sep;
}

export function dirname(path: string): string {
  const normalized = normalizeSeparators(path);
  const lastSlash = normalized.lastIndexOf("/");

  if (lastSlash === -1) {
    return ".";
  }

  if (lastSlash === 0) {
    return sepPosix;
  }

  const result = normalized.slice(0, lastSlash);
  return result || sepPosix;
}

export function relative(from: string, to: string): string {
  const fromParts = normalizeSeparators(from).split("/");
  const toParts = normalizeSeparators(to).split("/");

  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }

  if (toParts.length === 0) {
    return ".";
  }

  return toParts.join("/");
}

export function join(...segments: string[]): string {
  const parts = segments.flatMap(s => normalizeSeparators(s).split("/")).filter(Boolean);
  const isAbsolute = segments[0]?.startsWith("/") || segments[0]?.startsWith("\\");

  const result = parts.join("/");
  return isAbsolute ? `/${result}` : result;
}

export function extname(path: string): string {
  const name = basename(path);
  const dotIndex = name.lastIndexOf(".");

  if (dotIndex === -1 || dotIndex === 0) {
    return "";
  }

  return name.slice(dotIndex);
}
