import { createDecorator } from "@/core/di/instantiation";

export interface IClipboardService {
  readonly _serviceBrand: undefined;
  writeText: (text: string) => void;
  readText: () => Promise<string>;
}

export const IClipboardService = createDecorator<IClipboardService>("clipboard-service");
