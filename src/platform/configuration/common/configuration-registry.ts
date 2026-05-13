/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { Event } from "@core/base/event";
import type { IStringDictionary } from "@core/base/collections";

import { Emitter } from "@core/base/event";
import { distinct } from "@core/base/arrays";
import { Disposable } from "@core/base/lifecycle";

import { Registry } from "../../registry/common/platform";

export const Extensions = {
  Configuration: "base.contributions.configuration",
};

export enum ConfigurationScope {
  APPLICATION = 1,
  MACHINE,
  APPLICATION_MACHINE,
  WINDOW,
  RESOURCE,
  LANGUAGE_OVERRIDABLE,
  MACHINE_OVERRIDABLE,
}

export interface IConfigurationPropertySchema {
  scope?: ConfigurationScope;
  restricted?: boolean;
  included?: boolean;
  tags?: string[];
  ignoreSync?: boolean;
  disallowSyncIgnore?: boolean;
  disallowConfigurationDefault?: boolean;
  enumItemLabels?: string[];
  keywords?: string[];
  editPresentation?: "multilineText" | "singlelineText";
  order?: number;
  deprecationMessage?: string;
  markdownDeprecationMessage?: string;
  policy?: { name: string };
  default?: unknown;
  type?: string | string[];
  enum?: unknown[];
  enumDescriptions?: string[];
  markdownEnumDescriptions?: string[];
  description?: string;
  markdownDescription?: string;
  minimum?: number;
  maximum?: number;
}

export interface IExtensionInfo {
  id: string;
  displayName?: string;
}

export interface IConfigurationNode {
  id?: string;
  order?: number;
  type?: string | string[];
  title?: string;
  description?: string;
  properties?: IStringDictionary<IConfigurationPropertySchema>;
  allOf?: IConfigurationNode[];
  scope?: ConfigurationScope;
  extensionInfo?: IExtensionInfo;
  restrictedProperties?: string[];
}

export interface IConfigurationDefaults {
  overrides: IStringDictionary<unknown>;
  source?: IExtensionInfo | string;
  donotCache?: boolean;
  preventExperimentOverride?: boolean;
}

export type IRegisteredConfigurationPropertySchema = IConfigurationPropertySchema & {
  section?: {
    id?: string;
    title?: string;
    order?: number;
    extensionInfo?: IExtensionInfo;
  };
  defaultDefaultValue?: unknown;
  source?: IExtensionInfo | string;
  defaultValueSource?: IExtensionInfo | string | Map<string, IExtensionInfo | string>;
};

export interface IConfigurationDelta {
  removedDefaults?: IConfigurationDefaults[];
  removedConfigurations?: IConfigurationNode[];
  addedDefaults?: IConfigurationDefaults[];
  addedConfigurations?: IConfigurationNode[];
}

export interface IConfigurationRegistry {
  registerConfiguration: (configuration: IConfigurationNode) => IConfigurationNode;
  registerConfigurations: (configurations: IConfigurationNode[], validate?: boolean) => void;
  deregisterConfigurations: (configurations: IConfigurationNode[]) => void;
  updateConfigurations: (configurations: { add: IConfigurationNode[]; remove: IConfigurationNode[] }) => void;
  registerDefaultConfigurations: (defaultConfigurations: IConfigurationDefaults[]) => void;
  deregisterDefaultConfigurations: (defaultConfigurations: IConfigurationDefaults[]) => void;
  deltaConfiguration: (delta: IConfigurationDelta) => void;
  getRegisteredDefaultConfigurations: () => IConfigurationDefaults[];
  getConfigurationDefaultsOverrides: () => Map<string, IConfigurationDefaultOverrideValue>;
  getConfigurationProperties: () => IStringDictionary<IRegisteredConfigurationPropertySchema>;
  getExcludedConfigurationProperties: () => IStringDictionary<IRegisteredConfigurationPropertySchema>;
  getPolicyConfigurations: () => Map<string, string>;
  notifyConfigurationSchemaUpdated: (...configurations: IConfigurationNode[]) => void;
  readonly onDidSchemaChange: Event<void>;
  readonly onDidUpdateConfiguration: Event<{ properties: ReadonlySet<string>; defaultsOverrides?: boolean }>;
}

export interface IConfigurationDefaultOverride {
  readonly value: unknown;
  readonly source?: IExtensionInfo | string;
}

export interface IConfigurationDefaultOverrideValue {
  readonly value: unknown;
  readonly source?: IExtensionInfo | string | Map<string, IExtensionInfo | string>;
}

const OVERRIDE_IDENTIFIER_PATTERN = `\\[([^\\]]+)\\]`;
const OVERRIDE_IDENTIFIER_REGEX = new RegExp(OVERRIDE_IDENTIFIER_PATTERN, "g");
export const OVERRIDE_PROPERTY_PATTERN = `^(${OVERRIDE_IDENTIFIER_PATTERN})+$`;
export const OVERRIDE_PROPERTY_REGEX = new RegExp(OVERRIDE_PROPERTY_PATTERN);

export function overrideIdentifiersFromKey(key: string): string[] {
  const identifiers: string[] = [];
  if (OVERRIDE_PROPERTY_REGEX.test(key)) {
    let matches = OVERRIDE_IDENTIFIER_REGEX.exec(key);
    while (matches?.length) {
      const identifier = matches[1].trim();
      if (identifier) {
        identifiers.push(identifier);
      }
      matches = OVERRIDE_IDENTIFIER_REGEX.exec(key);
    }
  }
  return distinct(identifiers);
}

export function keyFromOverrideIdentifiers(overrideIdentifiers: string[]): string {
  return overrideIdentifiers.reduce((result, overrideIdentifier) => `${result}[${overrideIdentifier}]`, "");
}

export function getDefaultValue(type: string | string[] | undefined) {
  const t = Array.isArray(type) ? type[0] : <string>type;
  switch (t) {
    case "boolean":
      return false;
    case "integer":
    case "number":
      return 0;
    case "string":
      return "";
    case "array":
      return [];
    case "object":
      return {};
    default:
      return null;
  }
}

class ConfigurationRegistry extends Disposable implements IConfigurationRegistry {
  private readonly registeredConfigurationDefaults: IConfigurationDefaults[] = [];
  private readonly configurationDefaultsOverrides = new Map<string, { configurationDefaultOverrides: IConfigurationDefaultOverride[]; configurationDefaultOverrideValue?: IConfigurationDefaultOverrideValue }>();
  private readonly configurationContributors: IConfigurationNode[] = [];
  private readonly configurationProperties: IStringDictionary<IRegisteredConfigurationPropertySchema> = {};
  private readonly policyConfigurations = new Map<string, string>();
  private readonly excludedConfigurationProperties: IStringDictionary<IRegisteredConfigurationPropertySchema> = {};
  private readonly overrideIdentifiers = new Set<string>();

  private readonly _onDidSchemaChange = this._register(new Emitter<void>());
  readonly onDidSchemaChange: Event<void> = this._onDidSchemaChange.event;

  private readonly _onDidUpdateConfiguration = this._register(new Emitter<{ properties: ReadonlySet<string>; defaultsOverrides?: boolean }>());
  readonly onDidUpdateConfiguration = this._onDidUpdateConfiguration.event;

  registerConfiguration(configuration: IConfigurationNode): IConfigurationNode {
    this.registerConfigurations([configuration]);
    return configuration;
  }

  registerConfigurations(configurations: IConfigurationNode[], _validate: boolean = true): void {
    const properties = new Set<string>();
    for (const configuration of configurations) {
      this.configurationContributors.push(configuration);
      if (configuration.properties) {
        for (const key in configuration.properties) {
          this.configurationProperties[key] = { ...configuration.properties[key], section: { id: configuration.id, title: configuration.title, order: configuration.order, extensionInfo: configuration.extensionInfo } };
          properties.add(key);
        }
      }
    }
    this._onDidSchemaChange.fire();
    this._onDidUpdateConfiguration.fire({ properties });
  }

  deregisterConfigurations(configurations: IConfigurationNode[]): void {
    const properties = new Set<string>();
    for (const configuration of configurations) {
      const index = this.configurationContributors.indexOf(configuration);
      if (index !== -1) {
        this.configurationContributors.splice(index, 1);
      }
      if (configuration.properties) {
        for (const key in configuration.properties) {
          delete this.configurationProperties[key];
          properties.add(key);
        }
      }
    }
    this._onDidSchemaChange.fire();
    this._onDidUpdateConfiguration.fire({ properties });
  }

  updateConfigurations({ add, remove }: { add: IConfigurationNode[]; remove: IConfigurationNode[] }): void {
    const properties = new Set<string>();
    this.deregisterConfigurations(remove);
    this.registerConfigurations(add, false);
    this._onDidSchemaChange.fire();
    this._onDidUpdateConfiguration.fire({ properties });
  }

  registerDefaultConfigurations(configurationDefaults: IConfigurationDefaults[]): void {
    const properties = new Set<string>();
    this.registeredConfigurationDefaults.push(...configurationDefaults);
    for (const { overrides } of configurationDefaults) {
      for (const key in overrides) {
        properties.add(key);
        const overridesForKey = this.configurationDefaultsOverrides.get(key)
          ?? this.configurationDefaultsOverrides.set(key, { configurationDefaultOverrides: [] }).get(key)!;
        overridesForKey.configurationDefaultOverrides.push({ value: overrides[key] });
        if (OVERRIDE_PROPERTY_REGEX.test(key)) {
          const mergedValue = this.mergeDefaultConfigurationsForOverrideIdentifier(key, overrides[key] as IStringDictionary<unknown>, overridesForKey.configurationDefaultOverrideValue);
          if (mergedValue) {
            overridesForKey.configurationDefaultOverrideValue = mergedValue;
            this.configurationProperties[key] = { default: mergedValue.value, type: "object" };
          }
          this.overrideIdentifiers.add(key);
        }
        else {
          const mergedValue = this.mergeDefaultConfigurationsForConfigurationProperty(key, overrides[key], overridesForKey.configurationDefaultOverrideValue);
          if (mergedValue) {
            overridesForKey.configurationDefaultOverrideValue = mergedValue;
          }
          const property = this.configurationProperties[key];
          if (property) {
            property.default = mergedValue?.value;
          }
        }
      }
    }
    this._onDidSchemaChange.fire();
    this._onDidUpdateConfiguration.fire({ properties, defaultsOverrides: true });
  }

  deregisterDefaultConfigurations(defaultConfigurations: IConfigurationDefaults[]): void {
    const properties = new Set<string>();
    for (const defaultConfiguration of defaultConfigurations) {
      const index = this.registeredConfigurationDefaults.indexOf(defaultConfiguration);
      if (index !== -1) {
        this.registeredConfigurationDefaults.splice(index, 1);
      }
    }
    for (const { overrides } of defaultConfigurations) {
      for (const key in overrides) {
        const overridesForKey = this.configurationDefaultsOverrides.get(key);
        if (!overridesForKey) {
          continue;
        }
        const idx = overridesForKey.configurationDefaultOverrides.findIndex(o => o.value === overrides[key]);
        if (idx !== -1) {
          overridesForKey.configurationDefaultOverrides.splice(idx, 1);
        }
        if (overridesForKey.configurationDefaultOverrides.length === 0) {
          this.configurationDefaultsOverrides.delete(key);
        }
        properties.add(key);
      }
    }
    this._onDidSchemaChange.fire();
    this._onDidUpdateConfiguration.fire({ properties, defaultsOverrides: true });
  }

  deltaConfiguration(delta: IConfigurationDelta): void {
    if (delta.removedDefaults) {
      this.deregisterDefaultConfigurations(delta.removedDefaults);
    }
    if (delta.removedConfigurations) {
      this.deregisterConfigurations(delta.removedConfigurations);
    }
    if (delta.addedDefaults) {
      this.registerDefaultConfigurations(delta.addedDefaults);
    }
    if (delta.addedConfigurations) {
      this.registerConfigurations(delta.addedConfigurations);
    }
  }

  getRegisteredDefaultConfigurations(): IConfigurationDefaults[] {
    return this.registeredConfigurationDefaults.slice();
  }

  getConfigurationDefaultsOverrides(): Map<string, IConfigurationDefaultOverrideValue> {
    const result = new Map<string, IConfigurationDefaultOverrideValue>();
    for (const [key, value] of this.configurationDefaultsOverrides) {
      if (value.configurationDefaultOverrideValue) {
        result.set(key, value.configurationDefaultOverrideValue);
      }
    }
    return result;
  }

  getConfigurationProperties(): IStringDictionary<IRegisteredConfigurationPropertySchema> {
    return this.configurationProperties;
  }

  getExcludedConfigurationProperties(): IStringDictionary<IRegisteredConfigurationPropertySchema> {
    return this.excludedConfigurationProperties;
  }

  getPolicyConfigurations(): Map<string, string> {
    return this.policyConfigurations;
  }

  notifyConfigurationSchemaUpdated(..._configurations: IConfigurationNode[]): void {
    // simplified
  }

  private mergeDefaultConfigurationsForOverrideIdentifier(_key: string, value: IStringDictionary<unknown>, existing?: IConfigurationDefaultOverrideValue): IConfigurationDefaultOverrideValue | undefined {
    const merged = existing ? { ...existing.value as IStringDictionary<unknown>, ...value } : value;
    return { value: merged };
  }

  private mergeDefaultConfigurationsForConfigurationProperty(_key: string, value: unknown, existing?: IConfigurationDefaultOverrideValue): IConfigurationDefaultOverrideValue | undefined {
    return { value: value ?? existing?.value };
  }
}

export const configurationRegistry = new ConfigurationRegistry();
Registry.add(Extensions.Configuration, configurationRegistry);
