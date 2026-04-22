import type { IDisposable } from "@atlas/shared";

import { inject } from "vue";
import { DisposableStore } from "@atlas/shared";

import type { IKeybindingRule } from "@/services/keybindings/keybindings-registry";

import { InstantiationServiceKey } from "@/injection-keys";
import { IKeybindingService } from "@/services/keybindings/keybindings.service";
import { IKeybindingsRegistry } from "@/services/keybindings/keybindings-registry";

export function useKeybindings() {
  const instantiationService = inject(InstantiationServiceKey);
  if (!instantiationService) {
    throw new Error("InstantiationService not provided");
  }

  const keybindingService = instantiationService.invokeFunction((accessor) => {
    return accessor.get(IKeybindingService);
  });

  const keybindingsRegistry = instantiationService.invokeFunction((accessor) => {
    return accessor.get(IKeybindingsRegistry);
  });

  const disposables = new DisposableStore();

  function registerKeybinding(rule: IKeybindingRule): IDisposable {
    const disposable = keybindingsRegistry.registerKeybindingRule(rule);
    disposables.add(disposable);
    keybindingService.updateResolver();
    return disposable;
  }

  function dispose(): void {
    disposables.dispose();
  }

  return {
    keybindingService,
    keybindingsRegistry,
    registerKeybinding,
    dispose,
  };
}
