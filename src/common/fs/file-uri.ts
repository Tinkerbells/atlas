import { URI } from "./uri";

export namespace FileUri {
  export function create(fsPath: string): URI {
    return URI.fromFilePath(fsPath);
  }

  export function fsPath(uri: URI | string): string {
    if (typeof uri === "string") {
      return fsPath(URI.parse(uri));
    }
    return uri.fsPath;
  }
}
