import { URI } from "./uri";
import { FileType } from "./fs-provider";
import type { IFileSystemProvider, FileStat } from "./fs-provider";

export interface ResolveFileOptions {
  resolveChildren?: boolean;
  resolveMetadata?: boolean;
}

export class FSService {
  private readonly providers = new Map<string, IFileSystemProvider>();

  registerProvider(scheme: string, provider: IFileSystemProvider): () => void {
    if (this.providers.has(scheme)) {
      throw new Error(`FileSystemProvider for scheme '${scheme}' is already registered`);
    }
    this.providers.set(scheme, provider);
    return () => {
      this.providers.delete(scheme);
    };
  }

  getProvider(scheme: string): IFileSystemProvider | undefined {
    return this.providers.get(scheme);
  }

  async stat(resource: URI): Promise<FileStat> {
    const provider = this.resolveProvider(resource);
    const stat = await provider.stat(resource);
    return {
      resource,
      name: resource.path.substring(resource.path.lastIndexOf("/") + 1) || resource.path,
      isDirectory: (stat.type & FileType.Directory) !== 0,
      isFile: (stat.type & FileType.File) !== 0,
      isSymbolicLink: (stat.type & FileType.SymbolicLink) !== 0,
      ...stat,
    };
  }

  async resolve(resource: URI, options: ResolveFileOptions = {}): Promise<FileStat> {
    const stat = await this.stat(resource);
    if (options.resolveChildren && stat.isDirectory) {
      const provider = this.resolveProvider(resource);
      const childrenEntries = await provider.readdir(resource);
      const children = await Promise.all(
        childrenEntries.map(([name]) => this.stat(resource.resolve(name))),
      );
      return { ...stat, children };
    }
    return stat;
  }

  private resolveProvider(resource: URI): IFileSystemProvider {
    const provider = this.providers.get(resource.scheme);
    if (!provider) {
      throw new Error(`No FileSystemProvider registered for scheme '${resource.scheme}'`);
    }
    return provider;
  }
}
