import { inject } from "vue";

import type { IDisposable } from "@/core/base";
import type { IKeybindingRule } from "@/platform/keybindings/renderer/keybindings-registry";

import { DisposableStore } from "@/core/base";
import { InstantiationServiceKey } from "@/ui/injection-keys";
import { IKeybindingService } from "@/platform/keybindings/renderer/keybindings.service";
import { IKeybindingsRegistry } from "@/platform/keybindings/renderer/keybindings-registry";

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
