import { inject } from "vue";
import { InstantiationServiceKey } from "@renderer/injection-keys";
import { ICommandRegistry } from "@platform/commands/renderer/commands";
import { ICommandService } from "@platform/commands/renderer/commands-service";

export function useCommands() {
  const instantiationService = inject(InstantiationServiceKey);
  if (!instantiationService) {
    throw new Error("InstantiationService not provided");
  }

  const commandService = instantiationService.invokeFunction(accessor =>
    accessor.get(ICommandService),
  );
  const commandRegistry = instantiationService.invokeFunction(accessor =>
    accessor.get(ICommandRegistry),
  );

  const execute = (id: string, ...args: unknown[]) =>
    commandService.executeCommand(id, ...args);

  const register = (id: string, handler: (...args: any[]) => void) =>
    commandRegistry.registerCommand(id, handler);

  return { execute, register, commandService, commandRegistry };
}
