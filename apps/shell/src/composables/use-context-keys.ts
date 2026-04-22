import { inject } from "vue";
import { InstantiationServiceKey } from "~/injection-keys";
import { IContextKeyService } from "~/services/context/context-key";

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
