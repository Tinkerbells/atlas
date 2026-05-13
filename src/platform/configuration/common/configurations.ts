/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { Event } from "@core/base/event";
import type { ILogger } from "@platform/logger/common/logger";
import type { IStringDictionary } from "@core/base/collections";

import { Emitter } from "@core/base/event";
import { deepClone } from "@core/base/objects";
import { Disposable } from "@core/base/lifecycle";
import { Registry } from "@platform/registry/common/platform";

import type { IConfigurationRegistry, IRegisteredConfigurationPropertySchema } from "./configuration-registry";

import { Extensions } from "./configuration-registry";
import { ConfigurationModel } from "./configuration-models";

export class DefaultConfiguration extends Disposable {
  private readonly _onDidChangeConfiguration = this._register(new Emitter<{ defaults: ConfigurationModel; properties: string[] }>());
  readonly onDidChangeConfiguration = this._onDidChangeConfiguration.event;

  private _configurationModel: ConfigurationModel;
  get configurationModel(): ConfigurationModel {
    return this._configurationModel;
  }

  constructor(private readonly logService: ILogger) {
    super();
    this._configurationModel = ConfigurationModel.createEmptyModel(logService);
  }

  async initialize(): Promise<ConfigurationModel> {
    this.resetConfigurationModel();
    this._register(Registry.as<IConfigurationRegistry>(Extensions.Configuration).onDidUpdateConfiguration(({ properties, defaultsOverrides }) => this.onDidUpdateConfiguration(Array.from(properties), defaultsOverrides)));
    return this.configurationModel;
  }

  reload(): ConfigurationModel {
    this.resetConfigurationModel();
    return this.configurationModel;
  }

  protected onDidUpdateConfiguration(properties: string[], _defaultsOverrides?: boolean): void {
    this.updateConfigurationModel(properties, Registry.as<IConfigurationRegistry>(Extensions.Configuration).getConfigurationProperties());
    this._onDidChangeConfiguration.fire({ defaults: this.configurationModel, properties });
  }

  protected getConfigurationDefaultOverrides(): IStringDictionary<unknown> {
    return {};
  }

  private resetConfigurationModel(): void {
    this._configurationModel = ConfigurationModel.createEmptyModel(this.logService);
    const properties = Registry.as<IConfigurationRegistry>(Extensions.Configuration).getConfigurationProperties();
    this.updateConfigurationModel(Object.keys(properties), properties);
  }

  private updateConfigurationModel(properties: string[], configurationProperties: IStringDictionary<IRegisteredConfigurationPropertySchema>): void {
    const configurationDefaultsOverrides = this.getConfigurationDefaultOverrides();
    for (const key of properties) {
      const defaultOverrideValue = configurationDefaultsOverrides[key];
      const propertySchema = configurationProperties[key];
      if (defaultOverrideValue !== undefined) {
        this._configurationModel.setValue(key, defaultOverrideValue);
      }
      else if (propertySchema) {
        this._configurationModel.setValue(key, this.getDefaultValue(key, propertySchema));
      }
      else {
        this._configurationModel.removeValue(key);
      }
    }
  }

  protected getDefaultValue(_key: string, propertySchema: IRegisteredConfigurationPropertySchema): unknown {
    return deepClone(propertySchema.default);
  }
}

export interface IPolicyConfiguration {
  readonly onDidChangeConfiguration: Event<ConfigurationModel>;
  readonly configurationModel: ConfigurationModel;
  initialize: () => Promise<ConfigurationModel>;
}

export class NullPolicyConfiguration implements IPolicyConfiguration {
  readonly onDidChangeConfiguration: Event<ConfigurationModel> = () => ({ dispose() {} });
  readonly configurationModel = ConfigurationModel.createEmptyModel({ error: () => {} } as any);
  async initialize() { return this.configurationModel; }
}
