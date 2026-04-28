import type { ICommandRegistry } from "~/services/commands/commands";
import type { CommandPaletteGroup, CommandPaletteItem } from "@nuxt/ui";

import type { IQuickAccessProvider } from "./types";

export class CommandProvider implements IQuickAccessProvider {
  constructor(private _commandRegistry: ICommandRegistry) {}

  getPicks(_filter: string, _signal: AbortSignal): CommandPaletteGroup[] {
    const commands = this._commandRegistry.getCommands();

    const items: CommandPaletteItem[] = commands.map(command => ({
      label: command.id,
      onSelect: () => {
        command.handler();
      },
    }));

    return [
      {
        id: "commands",
        label: "Commands",
        items,
      },
    ];
  }
}
