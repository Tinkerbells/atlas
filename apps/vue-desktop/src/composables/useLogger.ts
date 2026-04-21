import { inject } from "vue";

import { ILogger } from "@/services/logger/logger";
import { InstantiationServiceKey } from "@/injection-keys";

export function useLogger() {
  const instantiationService = inject(InstantiationServiceKey);
  if (!instantiationService) {
    throw new Error("InstantiationService not provided");
  }
  return instantiationService.invokeFunction(accessor => accessor.get(ILogger));
}
