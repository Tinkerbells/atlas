import type { InjectionKey } from "vue";
import type { IInstantiationService } from "@core/di";

export const InstantiationServiceKey: InjectionKey<IInstantiationService>
  = Symbol("IInstantiationService");
