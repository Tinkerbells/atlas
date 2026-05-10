import type { IDisposable } from "@/core/base";
import type { IKeybindingService } from "@/platform/keybindings/renderer/keybindings.service";
import type { CommandHandler, ICommandRegistry } from "@/platform/commands/renderer/commands";
import type { IKeybindingRule, IKeybindingsRegistry } from "@/platform/keybindings/renderer/keybindings-registry";

import { DisposableStore } from "@/core/base";

export interface IContribution {
  registerCommands: (registry: ICommandRegistry) => void;
  registerKeybindings?: (registry: IKeybindingsRegistry) => void;
}

export interface CommandDescriptor {
  id: string;
  handler: CommandHandler;
  keybinding?: Omit<IKeybindingRule, "id">;
}

export class ContributionRegistry implements IDisposable {
  private _disposables = new DisposableStore();

  constructor(
    private readonly _commandRegistry: ICommandRegistry,
    private readonly _keybindingsRegistry: IKeybindingsRegistry,
    private readonly _keybindingService: IKeybindingService,
  ) {}

  registerContribution(contribution: IContribution): void {
    contribution.registerCommands(this._commandRegistry);
    if (contribution.registerKeybindings) {
      contribution.registerKeybindings(this._keybindingsRegistry);
      this._keybindingService.updateResolver();
    }
  }

  register(descriptor: CommandDescriptor): IDisposable {
    const store = new DisposableStore();

    store.add(this._commandRegistry.registerCommand(descriptor.id, descriptor.handler));

    if (descriptor.keybinding) {
      const rule: IKeybindingRule = {
        id: descriptor.id,
        ...descriptor.keybinding,
      };
      store.add(this._keybindingsRegistry.registerKeybindingRule(rule));
      this._keybindingService.updateResolver();
    }

    this._disposables.add(store);

    return {
      dispose: () => {
        store.dispose();
      },
    };
  }

  registerAll(descriptors: CommandDescriptor[]): void {
    for (const descriptor of descriptors) {
      this.register(descriptor);
    }
  }

  dispose(): void {
    this._disposables.dispose();
  }
}
