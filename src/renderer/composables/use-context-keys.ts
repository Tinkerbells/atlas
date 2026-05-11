import { inject } from "vue";
import { InstantiationServiceKey } from "@renderer/injection-keys";
import { IContextKeyService } from "@platform/context/renderer/context-key";

export function useContextKeys() {
  const instantiationService = inject(InstantiationServiceKey);
  if (!instantiationService) {
    throw new Error("InstantiationService not provided");
  }

  const contextKeyService = instantiationService.invokeFunction(accessor =>
    accessor.get(IContextKeyService),
  );

  return { contextKeyService };
}
