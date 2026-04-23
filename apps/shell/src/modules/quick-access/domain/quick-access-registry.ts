import type { IDisposable } from "@atlas/shared";

import { Disposable, DisposableStore } from "@atlas/shared";

import type { IQuickAccessRegistry, QuickAccessProviderDescriptor } from "./types";

export class QuickAccessRegistry extends Disposable implements IQuickAccessRegistry {
  private _providers: QuickAccessProviderDescriptor[] = [];

  registerProvider(descriptor: QuickAccessProviderDescriptor): IDisposable {
    this._providers.push(descriptor);

    this._providers.sort((a, b) => b.prefix.length - a.prefix.length);

    const store = new DisposableStore();
    store.add({
      dispose: () => {
        const index = this._providers.indexOf(descriptor);
        if (index !== -1) {
          this._providers.splice(index, 1);
        }
      },
    });

    return store;
  }

  resolve(searchTerm: string): { descriptor: QuickAccessProviderDescriptor; filter: string } | undefined {
    for (const descriptor of this._providers) {
      if (descriptor.prefix === "" || searchTerm.startsWith(descriptor.prefix)) {
        return {
          descriptor,
          filter: searchTerm.slice(descriptor.prefix.length),
        };
      }
    }

    return undefined;
  }

  dispose(): void {
    this._providers = [];
    super.dispose();
  }
}
