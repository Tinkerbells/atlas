import type { IStorageService } from "~/main/storage";
import type {
  RemoteBookmarksServer,
  RemoteRecentFilesServer,
  RemoteStorageServer,
  RemoteThemeServer,
} from "~/common/messaging/service-protocols";

export class StorageRpcServer implements RemoteStorageServer {
  constructor(private readonly storage: IStorageService) {}

  async get(key: string, defaultValue?: unknown): Promise<unknown> {
    return this.storage.get(key, defaultValue);
  }

  async set(key: string, value: unknown): Promise<void> {
    this.storage.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

export class ThemeRpcServer implements RemoteThemeServer {
  private readonly KEY = "theme.current";

  constructor(private readonly storage: IStorageService) {}

  async get(): Promise<string | undefined> {
    return this.storage.get<string>(this.KEY);
  }

  async set(theme: string): Promise<void> {
    this.storage.set(this.KEY, theme);
  }
}

export class RecentFilesRpcServer implements RemoteRecentFilesServer {
  private readonly KEY = "recentFiles";

  constructor(private readonly storage: IStorageService) {}

  async get(): Promise<string[]> {
    return this.storage.get<string[]>(this.KEY, []) ?? [];
  }

  async add(uri: string): Promise<void> {
    const files = new Set(await this.get());
    files.delete(uri);
    files.add(uri);
    this.storage.set(this.KEY, Array.from(files).slice(-20));
  }

  async remove(uri: string): Promise<void> {
    const files = (await this.get()).filter(f => f !== uri);
    this.storage.set(this.KEY, files);
  }
}

export class BookmarksRpcServer implements RemoteBookmarksServer {
  private readonly KEY = "bookmarks";

  constructor(private readonly storage: IStorageService) {}

  async get(): Promise<string[]> {
    return this.storage.get<string[]>(this.KEY, []) ?? [];
  }

  async add(uri: string): Promise<void> {
    const marks = new Set(await this.get());
    marks.add(uri);
    this.storage.set(this.KEY, Array.from(marks));
  }

  async remove(uri: string): Promise<void> {
    const marks = (await this.get()).filter(m => m !== uri);
    this.storage.set(this.KEY, marks);
  }
}
