import type { ICommandService } from "./commands-service";

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
    executeCommand: (commandId: string, ...args: unknown[]) => {
      calls.push({ commandId, args });
      return Promise.resolve(undefined);
    },
  };

  return { service, calls };
}
