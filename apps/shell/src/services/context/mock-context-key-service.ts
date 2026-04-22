import type { ContextKeyExpression, ContextKeyValue, IContext, IContextKey, IContextKeyService, IScopedContextKeyService } from "./context-key";

export function createContext(ctx: Record<string, unknown>): IContext {
  return {
    getValue: <T extends ContextKeyValue = ContextKeyValue>(key: string): T | undefined => {
      return (ctx as Record<string, unknown>)[key] as T | undefined;
    },
  };
}

export function createMockContextKeyService(contextValue: IContext | null = null): {
  service: IContextKeyService;
  setContextValue: (ctx: IContext) => void;
} {
  let currentContext = contextValue;

  const service: IContextKeyService = {
    _serviceBrand: undefined,

    createKey: <T extends ContextKeyValue>(): IContextKey<T> => ({
      set: () => {},
      reset: () => {},
      get: () => undefined,
    }),

    contextMatchesRules: (rules: ContextKeyExpression | undefined): boolean => {
      if (!rules)
        return true;
      if (!currentContext)
        return false;
      return rules.evaluate(currentContext);
    },

    getContextKeyValue: () => undefined,

    createScoped: (): IScopedContextKeyService => {
      throw new Error("Not implemented in mock");
    },

    createOverlay: () => service,

    getContext: (): IContext => {
      return currentContext ?? createContext({});
    },
  };

  return {
    service,
    setContextValue: (ctx: IContext) => { currentContext = ctx; },
  };
}
