import type { ServiceIdentifier, ServicesAccessor } from "@core/di/instantiation";

import { inject } from "vue";

export const ServiceAccessorSymbol = Symbol("ServiceAccessor");

export function useService<T>(id: ServiceIdentifier<T>): T {
  const accessor = inject<ServicesAccessor>(ServiceAccessorSymbol);
  if (!accessor) {
    throw new Error(`[DI] ServiceAccessor not found in Vue context when requesting ${id.toString()}`);
  }

  return accessor.get(id);
}
