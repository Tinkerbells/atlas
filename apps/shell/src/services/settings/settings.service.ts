import type { ILogger } from "../logger/logger";

export interface AppSettings {
  themePath?: string;
  themeName?: string;
  fontSize?: number;
  [key: string]: any;
}

export class SettingsService {
  private settings: AppSettings = {};

  constructor(private _logger: ILogger) {
    this.loadSettings();
  }

  private loadSettings(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      const savedSettings = localStorage.getItem("atlas-settings");
      if (savedSettings) {
        try {
          this.settings = JSON.parse(savedSettings);
        }
        catch (error) {
          this._logger.error("Failed to parse settings", {
            scope: "SettingsService",
            payload: { error },
          });
        }
      }
    }
  }

  private saveSettings(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("atlas-settings", JSON.stringify(this.settings));
    }
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] | undefined {
    return this.settings[key];
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value;
    this.saveSettings();
  }

  getAll(): AppSettings {
    return { ...this.settings };
  }

  reset(): void {
    this.settings = {};
    this.saveSettings();
  }
}
