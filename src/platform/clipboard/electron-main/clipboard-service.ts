import { clipboard } from "electron";

import type { IClipboardService } from "../common/clipboard";

export class ClipboardService implements IClipboardService {
  declare readonly _serviceBrand: undefined;

  writeText(text: string): void {
    clipboard.writeText(text);
  }

  readText(): Promise<string> {
    return Promise.resolve(clipboard.readText());
  }
}
