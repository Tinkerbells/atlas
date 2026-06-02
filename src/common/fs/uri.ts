import { URI as VsCodeUri } from "vscode-uri";

export interface UriComponents {
  scheme: string;
  authority: string;
  path: string;
  query: string;
  fragment: string;
}

export class URI {
  static fromComponents(components: UriComponents): URI {
    return new URI(VsCodeUri.from(components));
  }

  static fromFilePath(path: string): URI {
    return new URI(VsCodeUri.file(path));
  }

  static parse(value: string): URI {
    return new URI(VsCodeUri.parse(value));
  }

  private readonly codeUri: VsCodeUri;

  constructor(uri: string | VsCodeUri = "") {
    if (typeof uri === "string") {
      this.codeUri = VsCodeUri.parse(uri);
    }
    else {
      this.codeUri = uri;
    }
  }

  get scheme(): string {
    return this.codeUri.scheme;
  }

  get authority(): string {
    return this.codeUri.authority;
  }

  get path(): string {
    return this.codeUri.path;
  }

  get query(): string {
    return this.codeUri.query;
  }

  get fragment(): string {
    return this.codeUri.fragment;
  }

  get fsPath(): string {
    return this.codeUri.fsPath;
  }

  get parent(): URI {
    const dir = this.path.substring(0, this.path.lastIndexOf("/"));
    if (!dir || dir === this.path) {
      return this;
    }
    return this.withPath(dir || "/");
  }

  resolve(path: string): URI {
    const basePath = this.path.endsWith("/") ? this.path : `${this.path}/`;
    return new URI(
      VsCodeUri.from({
        ...this.codeUri.toJSON(),
        path: basePath + path,
      }),
    );
  }

  withScheme(scheme: string): URI {
    return new URI(
      VsCodeUri.from({
        ...this.codeUri.toJSON(),
        scheme,
      }),
    );
  }

  withPath(path: string): URI {
    return new URI(
      VsCodeUri.from({
        ...this.codeUri.toJSON(),
        path,
      }),
    );
  }

  toString(): string {
    return this.codeUri.toString();
  }

  toComponents(): UriComponents {
    return this.codeUri.toJSON();
  }

  isEqual(other: URI): boolean {
    return this.toString() === other.toString();
  }

  isEqualOrParent(candidate: URI): boolean {
    if (this.scheme !== candidate.scheme || this.authority !== candidate.authority) {
      return false;
    }
    const thisPath = this.path.endsWith("/") ? this.path : `${this.path}/`;
    const candidatePath = candidate.path.endsWith("/") ? candidate.path : `${candidate.path}/`;
    return candidatePath.startsWith(thisPath) || this.isEqual(candidate);
  }
}
