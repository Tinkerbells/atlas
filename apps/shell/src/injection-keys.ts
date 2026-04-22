import type { InjectionKey } from "vue";
import type { IInstantiationService } from "@atlas/di";

export const InstantiationServiceKey: InjectionKey<IInstantiationService>
  = Symbol("IInstantiationService");
