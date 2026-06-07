import type { App, InjectionKey } from "vue";

import { RemoteFileSystemProvider } from "../fs/remote-fs-provider";

export const FS_PROVIDER_KEY: InjectionKey<RemoteFileSystemProvider> = Symbol("fs-provider");

export function createFsProviderPlugin() {
  return {
    install(app: App) {
      const provider = new RemoteFileSystemProvider();
      app.provide(FS_PROVIDER_KEY, provider);
    },
  };
}
