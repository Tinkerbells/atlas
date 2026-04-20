import { inject } from 'vue';
import { IContextKeyService } from '@/services/context/context-key';
import { InstantiationServiceKey } from '@/injection-keys';

export function useContextKeys() {
  const instantiationService = inject(InstantiationServiceKey);
  if (!instantiationService) {
    throw new Error('InstantiationService not provided');
  }

  const contextKeyService = instantiationService.invokeFunction((accessor) =>
    accessor.get(IContextKeyService),
  );

  return { contextKeyService };
}
