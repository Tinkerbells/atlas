import { IClipboardService } from "@/platform/clipboard/common/clipboard";

import { useService } from "./use-service";

export function useClipboard(): IClipboardService {
  return useService(IClipboardService);
}
