export function illegalArgument(name?: string): Error {
  if (name) {
    return new Error(`Illegal argument: ${name}`);
  }
  return new Error("Illegal argument");
}

export function illegalState(name?: string): Error {
  if (name) {
    return new Error(`Illegal state: ${name}`);
  }
  return new Error("Illegal state");
}
