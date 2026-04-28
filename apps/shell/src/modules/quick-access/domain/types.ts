import type { IDisposable } from "@atlas/shared";
import type { CommandPaletteGroup } from "@nuxt/ui";

export interface IQuickAccessProvider {
  getPicks: (filter: string, signal: AbortSignal) => CommandPaletteGroup[] | Promise<CommandPaletteGroup[]>;
}

export interface QuickAccessProviderDescriptor {
  prefix: string;
  provider: IQuickAccessProvider;
  placeholder?: string;
}

export interface IQuickAccessRegistry {
  registerProvider: (descriptor: QuickAccessProviderDescriptor) => IDisposable;
  resolve: (searchTerm: string) => { descriptor: QuickAccessProviderDescriptor; filter: string } | undefined;
}

export { type CommandPaletteGroup } from "@nuxt/ui";
