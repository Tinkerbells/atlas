import { inject } from "vue";
import { ILogger } from "@platform/logger/common/logger";
import { InstantiationServiceKey } from "@renderer/injection-keys";

export function useLogger() {
  const instantiationService = inject(InstantiationServiceKey);
  if (!instantiationService) {
    throw new Error("InstantiationService not provided");
  }
  return instantiationService.invokeFunction(accessor => accessor.get(ILogger));
}
