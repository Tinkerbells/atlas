import type { ICommandService } from "@platform/commands/renderer/commands-service";

export interface TrackedCommandCall {
  commandId: string;
  args: unknown[];
}

export function createMockCommandService(): {
  service: ICommandService;
  calls: TrackedCommandCall[];
} {
  const calls: TrackedCommandCall[] = [];

  const service: ICommandService = {
    _serviceBrand: undefined,
    executeCommand: (commandId: string, ...args: unknown[]) => {
      calls.push({ commandId, args });
      return Promise.resolve(undefined);
    },
  };

  return { service, calls };
}
