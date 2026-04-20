import { inject } from 'vue';
import { ICommandService } from '@/services/commands/commands-service';
import { ICommandRegistry } from '@/services/commands/commands';
import { InstantiationServiceKey } from '@/injection-keys';

export function useCommands() {
  const instantiationService = inject(InstantiationServiceKey);
  if (!instantiationService) {
    throw new Error('InstantiationService not provided');
  }

  const commandService = instantiationService.invokeFunction((accessor) =>
    accessor.get(ICommandService),
  );
  const commandRegistry = instantiationService.invokeFunction((accessor) =>
    accessor.get(ICommandRegistry),
  );

  const execute = (id: string, ...args: unknown[]) =>
    commandService.executeCommand(id, ...args);

  const register = (id: string, handler: (...args: any[]) => void) =>
    commandRegistry.registerCommand(id, handler);

  return { execute, register, commandService, commandRegistry };
}
