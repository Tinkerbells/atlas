import type { AppSettings } from "~/services/settings/settings-service";

import { inject, readonly, ref } from "vue";
import { ILogger } from "~/services/logger/logger";
import { InstantiationServiceKey } from "~/injection-keys";
import { SettingsService } from "~/services/settings/settings-service";

export function useSettings() {
  const instantiationService = inject(InstantiationServiceKey);
  if (!instantiationService) {
    throw new Error("InstantiationService not provided");
  }

  const logger = instantiationService.invokeFunction(a => a.get(ILogger));
  const settingsService = new SettingsService(logger);

  const settings = ref<AppSettings>(settingsService.getAll());

  const get = <K extends keyof AppSettings>(key: K): AppSettings[K] | undefined =>
    settingsService.get(key);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]): void => {
    settingsService.set(key, value);
    settings.value = settingsService.getAll();
  };

  const reset = (): void => {
    settingsService.reset();
    settings.value = settingsService.getAll();
  };

  return { settings: readonly(settings), get, set, reset, settingsService };
}
