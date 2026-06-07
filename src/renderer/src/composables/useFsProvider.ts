import { inject } from "vue";

import type { RemoteFileSystemProvider } from "../fs/remote-fs-provider";

import { FS_PROVIDER_KEY } from "../plugins/fs-provider";

export function useFsProvider(): RemoteFileSystemProvider {
  const provider = inject<RemoteFileSystemProvider>(FS_PROVIDER_KEY);
  if (!provider) {
    throw new Error("FS provider not found. Did you forget to app.use(createFsProviderPlugin())?");
  }
  return provider;
}
