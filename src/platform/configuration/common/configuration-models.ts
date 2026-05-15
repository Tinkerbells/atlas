/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { Event } from "@core/base/event";
import type { ILogger } from "@platform/logger/common/logger";
import type { IStringDictionary } from "@core/base/collections";
import type { IFileService } from "@platform/files/common/files";
import type { JSONVisitor, ParseError, ParseErrorCode } from "jsonc-parser";

import { visit } from "jsonc-parser";
import * as types from "@core/base/types";
import { Emitter } from "@core/base/event";
import * as arrays from "@core/base/arrays";
import * as objects from "@core/base/objects";
import { URI } from "@platform/common/uri/uri";
import { Disposable } from "@core/base/lifecycle";

import type { ConfigurationScope, IConfigurationRegistry } from "./configuration-registry";
import type { IConfigurationChange, IConfigurationChangeEvent, IConfigurationCompareResult, IConfigurationData, IConfigurationModel, IConfigurationOverrides, IConfigurationValue, IInspectValue, IOverrides } from "./configuration";

import { Registry } from "../../registry/common/platform";
import { Extensions, OVERRIDE_PROPERTY_REGEX, overrideIdentifiersFromKey } from "./configuration-registry";
import { addToValueTree, ConfigurationTarget, getConfigurationValue, removeFromValueTree, toValuesTree } from "./configuration";

function freeze<T>(data: T): T {
  return Object.isFrozen(data) ? data : objects.deepFreeze(data);
}

type InspectValue<V> = IInspectValue<V> & { merged?: V };

export class ConfigurationModel implements IConfigurationModel {
  static createEmptyModel(logService: ILogger): ConfigurationModel {
    return new ConfigurationModel({}, [], [], undefined, logService);
  }

  private readonly overrideConfigurations = new Map<string, ConfigurationModel>();

  constructor(
    private readonly _contents: IStringDictionary<unknown>,
    private readonly _keys: string[],
    private readonly _overrides: IOverrides[],
    private readonly _raw: IStringDictionary<unknown> | ReadonlyArray<IStringDictionary<unknown> | ConfigurationModel> | undefined,
    private readonly logService: ILogger,
  ) {
  }

  private _rawConfiguration: ConfigurationModel | undefined;
  get rawConfiguration(): ConfigurationModel {
    if (!this._rawConfiguration) {
      if (this._raw) {
        const rawConfigurationModels = (Array.isArray(this._raw) ? this._raw : [this._raw]).map((raw) => {
          if (raw instanceof ConfigurationModel) {
            return raw;
          }
          const parser = new ConfigurationModelParser("", this.logService);
          parser.parseRaw(raw);
          return parser.configurationModel;
        });
        this._rawConfiguration = rawConfigurationModels.reduce((previous, current) => current === previous ? current : previous.merge(current), rawConfigurationModels[0]);
      }
      else {
        // raw is same as current
        this._rawConfiguration = this;
      }
    }
    return this._rawConfiguration;
  }

  get contents(): IStringDictionary<unknown> {
    return this._contents;
  }

  get overrides(): IOverrides[] {
    return this._overrides;
  }

  get keys(): string[] {
    return this._keys;
  }

  get raw(): IStringDictionary<unknown> | IStringDictionary<unknown>[] | undefined {
    if (!this._raw) {
      return undefined;
    }
    if (Array.isArray(this._raw) && this._raw.every(raw => raw instanceof ConfigurationModel)) {
      return undefined;
    }
    return this._raw as IStringDictionary<unknown> | IStringDictionary<unknown>[];
  }

  isEmpty(): boolean {
    return this._keys.length === 0 && Object.keys(this._contents).length === 0 && this._overrides.length === 0;
  }

  getValue<V>(section: string | undefined): V | undefined {
    return section ? getConfigurationValue<V>(this.contents, section) : this.contents as V;
  }

  inspect<V>(section: string | undefined, overrideIdentifier?: string | null): InspectValue<V> {
    const that = this;
    return {
      get value() {
        return freeze(that.rawConfiguration.getValue<V>(section));
      },
      get override() {
        return overrideIdentifier ? freeze(that.rawConfiguration.getOverrideValue<V>(section, overrideIdentifier)) : undefined;
      },
      get merged() {
        return freeze(overrideIdentifier ? that.rawConfiguration.override(overrideIdentifier).getValue<V>(section) : that.rawConfiguration.getValue<V>(section));
      },
      get overrides() {
        const overrides: { readonly identifiers: string[]; readonly value: V }[] = [];
        for (const { contents, identifiers, keys } of that.rawConfiguration.overrides) {
          const value = new ConfigurationModel(contents, keys, [], undefined, that.logService).getValue<V>(section);
          if (value !== undefined) {
            overrides.push({ identifiers, value });
          }
        }
        return overrides.length ? freeze(overrides) : undefined;
      },
    };
  }

  getOverrideValue<V>(section: string | undefined, overrideIdentifier: string): V | undefined {
    const overrideContents = this.getContentsForOverrideIdentifer(overrideIdentifier);
    return overrideContents
      ? section ? getConfigurationValue<V>(overrideContents, section) : overrideContents as V
      : undefined;
  }

  getKeysForOverrideIdentifier(identifier: string): string[] {
    const keys: string[] = [];
    for (const override of this.overrides) {
      if (override.identifiers.includes(identifier)) {
        keys.push(...override.keys);
      }
    }
    return arrays.distinct(keys);
  }

  getAllOverrideIdentifiers(): string[] {
    const result: string[] = [];
    for (const override of this.overrides) {
      result.push(...override.identifiers);
    }
    return arrays.distinct(result);
  }

  override(identifier: string): ConfigurationModel {
    let overrideConfigurationModel = this.overrideConfigurations.get(identifier);
    if (!overrideConfigurationModel) {
      overrideConfigurationModel = this.createOverrideConfigurationModel(identifier);
      this.overrideConfigurations.set(identifier, overrideConfigurationModel);
    }
    return overrideConfigurationModel;
  }

  merge(...others: ConfigurationModel[]): ConfigurationModel {
    const contents = objects.deepClone(this.contents);
    const overrides = objects.deepClone(this.overrides);
    const keys = [...this.keys];
    const raws = this._raw ? Array.isArray(this._raw) ? [...this._raw] : [this._raw] : [this];

    for (const other of others) {
      raws.push(...(other._raw ? Array.isArray(other._raw) ? [...other._raw] : [other._raw] : [other]));
      if (other.isEmpty()) {
        continue;
      }
      this.mergeContents(contents, other.contents);

      for (const otherOverride of other.overrides) {
        const [override] = overrides.filter(o => arrays.equals(o.identifiers, otherOverride.identifiers));
        if (override) {
          this.mergeContents(override.contents, otherOverride.contents);
          override.keys.push(...otherOverride.keys);
          override.keys = arrays.distinct(override.keys);
        }
        else {
          overrides.push(objects.deepClone(otherOverride));
        }
      }
      for (const key of other.keys) {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
    }
    return new ConfigurationModel(contents, keys, overrides, !raws.length || raws.every(raw => raw instanceof ConfigurationModel) ? undefined : raws, this.logService);
  }

  private createOverrideConfigurationModel(identifier: string): ConfigurationModel {
    const overrideContents = this.getContentsForOverrideIdentifer(identifier);

    if (!overrideContents || typeof overrideContents !== "object" || !Object.keys(overrideContents).length) {
      // If there are no valid overrides, return self
      return this;
    }

    const contents: IStringDictionary<unknown> = {};
    for (const key of arrays.distinct([...Object.keys(this.contents), ...Object.keys(overrideContents)])) {
      let contentsForKey = this.contents[key];
      const overrideContentsForKey = overrideContents[key];

      // If there are override contents for the key, clone and merge otherwise use base contents
      if (overrideContentsForKey) {
        // Clone and merge only if base contents and override contents are of type object otherwise just override
        if (typeof contentsForKey === "object" && typeof overrideContentsForKey === "object") {
          contentsForKey = objects.deepClone(contentsForKey);
          this.mergeContents(contentsForKey as IStringDictionary<unknown>, overrideContentsForKey as IStringDictionary<unknown>);
        }
        else {
          contentsForKey = overrideContentsForKey;
        }
      }

      contents[key] = contentsForKey;
    }

    return new ConfigurationModel(contents, this.keys, this.overrides, undefined, this.logService);
  }

  private mergeContents(source: IStringDictionary<unknown>, target: IStringDictionary<unknown>): void {
    for (const key of Object.keys(target)) {
      if (key in source) {
        if (types.isObject(source[key]) && types.isObject(target[key])) {
          this.mergeContents(source[key] as IStringDictionary<unknown>, target[key] as IStringDictionary<unknown>);
          continue;
        }
      }
      source[key] = objects.deepClone(target[key]);
    }
  }

  private getContentsForOverrideIdentifer(identifier: string): IStringDictionary<unknown> | null {
    let contentsForIdentifierOnly: IStringDictionary<unknown> | null = null;
    let contents: IStringDictionary<unknown> | null = null;
    const mergeContents = (contentsToMerge: IStringDictionary<unknown> | null) => {
      if (contentsToMerge) {
        if (contents) {
          this.mergeContents(contents, contentsToMerge);
        }
        else {
          contents = objects.deepClone(contentsToMerge);
        }
      }
    };
    for (const override of this.overrides) {
      if (override.identifiers.length === 1 && override.identifiers[0] === identifier) {
        contentsForIdentifierOnly = override.contents;
      }
      else if (override.identifiers.includes(identifier)) {
        mergeContents(override.contents);
      }
    }
    // Merge contents of the identifier only at the end to take precedence.
    mergeContents(contentsForIdentifierOnly);
    return contents;
  }

  toJSON(): IConfigurationModel {
    return {
      contents: this.contents,
      overrides: this.overrides,
      keys: this.keys,
    };
  }

  // Update methods

  public addValue(key: string, value: unknown): void {
    this.updateValue(key, value, true);
  }

  public setValue(key: string, value: unknown): void {
    this.updateValue(key, value, false);
  }

  public removeValue(key: string): void {
    const index = this.keys.indexOf(key);
    if (index === -1) {
      return;
    }
    this.keys.splice(index, 1);
    removeFromValueTree(this.contents, key);
    if (OVERRIDE_PROPERTY_REGEX.test(key)) {
      this.overrides.splice(this.overrides.findIndex(o => arrays.equals(o.identifiers, overrideIdentifiersFromKey(key))), 1);
    }
  }

  private updateValue(key: string, value: unknown, add: boolean): void {
    addToValueTree(this.contents, key, value, e => this.logService.error(e));
    add = add || !this.keys.includes(key);
    if (add) {
      this.keys.push(key);
    }
    if (OVERRIDE_PROPERTY_REGEX.test(key)) {
      const overrideContents = this.contents[key] as IStringDictionary<unknown>;
      const identifiers = overrideIdentifiersFromKey(key);
      const override = {
        identifiers,
        keys: Object.keys(overrideContents),
        contents: toValuesTree(overrideContents, message => this.logService.error(message)),
      };
      const index = this.overrides.findIndex(o => arrays.equals(o.identifiers, identifiers));
      if (index !== -1) {
        this.overrides[index] = override;
      }
      else {
        this.overrides.push(override);
      }
    }
  }
}

export interface ConfigurationParseOptions {
  skipUnregistered?: boolean;
  scopes?: ConfigurationScope[];
  skipRestricted?: boolean;
  include?: string[];
  exclude?: string[];
}

export class ConfigurationModelParser {
  private _raw: IStringDictionary<unknown> | null = null;
  private _configurationModel: ConfigurationModel | null = null;
  private _restrictedConfigurations: string[] = [];
  private _parseErrors: ParseError[] = [];

  constructor(
    protected readonly _name: string,
    protected readonly logService: ILogger,
  ) { }

  get configurationModel(): ConfigurationModel {
    return this._configurationModel || ConfigurationModel.createEmptyModel(this.logService);
  }

  get restrictedConfigurations(): string[] {
    return this._restrictedConfigurations;
  }

  get errors(): ParseError[] {
    return this._parseErrors;
  }

  public parse(content: string | null | undefined, options?: ConfigurationParseOptions): void {
    if (!types.isUndefinedOrNull(content)) {
      const raw = this.doParseContent(content);
      this.parseRaw(raw, options);
    }
  }

  public reparse(options: ConfigurationParseOptions): void {
    if (this._raw) {
      this.parseRaw(this._raw, options);
    }
  }

  public parseRaw(raw: IStringDictionary<unknown>, options?: ConfigurationParseOptions): void {
    this._raw = raw;
    const { contents, keys, overrides, restricted, hasExcludedProperties } = this.doParseRaw(raw, options);
    this._configurationModel = new ConfigurationModel(contents, keys, overrides, hasExcludedProperties ? [raw] : undefined /* raw has not changed */, this.logService);
    this._restrictedConfigurations = restricted || [];
  }

  private doParseContent(content: string): IStringDictionary<unknown> {
    let raw: IStringDictionary<unknown> = {};
    let currentProperty: string | null = null;
    let currentParent: unknown[] | IStringDictionary<unknown> = [];
    const previousParents: (unknown[] | IStringDictionary<unknown>)[] = [];
    const parseErrors: ParseError[] = [];

    function onValue(value: unknown) {
      if (Array.isArray(currentParent)) {
        currentParent.push(value);
      }
      else if (currentProperty !== null) {
        currentParent[currentProperty] = value;
      }
    }

    const visitor: JSONVisitor = {
      onObjectBegin: () => {
        const object = {};
        onValue(object);
        previousParents.push(currentParent);
        currentParent = object;
        currentProperty = null;
      },
      onObjectProperty: (name: string) => {
        currentProperty = name;
      },
      onObjectEnd: () => {
        currentParent = previousParents.pop()!;
      },
      onArrayBegin: () => {
        const array: unknown[] = [];
        onValue(array);
        previousParents.push(currentParent);
        currentParent = array;
        currentProperty = null;
      },
      onArrayEnd: () => {
        currentParent = previousParents.pop()!;
      },
      onLiteralValue: onValue,
      onError: (error: ParseErrorCode, _offset: number, _length: number) => {
        parseErrors.push({ error, offset: _offset, length: _length });
      },
    };
    if (content) {
      try {
        visit(content, visitor);
        raw = (currentParent[0] as IStringDictionary<unknown>) || {};
      }
      catch (e) {
        this.logService.error(`Error while parsing settings file ${this._name}: ${e}`);
        this._parseErrors = [e as ParseError];
      }
    }

    return raw;
  }

  protected doParseRaw(raw: IStringDictionary<unknown>, options?: ConfigurationParseOptions): IConfigurationModel & { restricted?: string[]; hasExcludedProperties?: boolean } {
    const registry = Registry.as<IConfigurationRegistry>(Extensions.Configuration);
    const properties = registry.getConfigurationProperties();
    const excludedConfigurationProperties = registry.getExcludedConfigurationProperties();
    const contents = Object.create(null);
    const overrides: IOverrides[] = [];
    const keys: string[] = [];
    let restricted: string[] | undefined;
    let hasExcludedProperties = false;

    for (const key of Object.keys(raw)) {
      if (OVERRIDE_PROPERTY_REGEX.test(key)) {
        const overrideRaw: IStringDictionary<unknown> = {};
        const rawOverride = raw[key] as IStringDictionary<unknown>;
        for (const keyInOverride of Object.keys(rawOverride)) {
          if (properties[keyInOverride] && this.shouldInclude(keyInOverride, options)) {
            overrideRaw[keyInOverride] = rawOverride[keyInOverride];
          }
        }
        overrides.push({
          identifiers: overrideIdentifiersFromKey(key),
          keys: Object.keys(overrideRaw),
          contents: toValuesTree(overrideRaw, message => this.logService.error(message)),
        });
      }
      else if (properties[key] && this.shouldInclude(key, options)) {
        if (options?.skipRestricted && excludedConfigurationProperties[key]) {
          if (!hasExcludedProperties) {
            restricted = [key];
            hasExcludedProperties = true;
          }
          else {
            restricted!.push(key);
          }
          continue;
        }
        contents[key] = raw[key];
        keys.push(key);
      }
    }
    return { contents: toValuesTree(contents, message => this.logService.error(message)), keys, overrides, restricted, hasExcludedProperties };
  }

  private shouldInclude(key: string, options?: ConfigurationParseOptions): boolean {
    if (!options?.include || options.include.includes(key)) {
      if (!options?.exclude || !options.exclude.includes(key)) {
        return true;
      }
    }
    return false;
  }
}

export class Configuration {
  private _defaultConfiguration: ConfigurationModel;
  private _policyConfiguration!: ConfigurationModel;
  private _applicationConfiguration!: ConfigurationModel;
  private _localUserConfiguration!: ConfigurationModel;
  private _remoteUserConfiguration!: ConfigurationModel;
  private _workspaceConfiguration!: ConfigurationModel;
  private readonly _foldersConsolidatedConfigurations = new Map<string, ConfigurationModel>();

  constructor(
    private readonly _defaultConfigurationModel: ConfigurationModel,
    private readonly _policyConfigurationModel: ConfigurationModel,
    private readonly _applicationConfigurationModel: ConfigurationModel,
    private readonly _localUserConfigurationModel: ConfigurationModel,
    private readonly _remoteUserConfigurationModel: ConfigurationModel,
    private readonly _workspaceConfigurationModel: ConfigurationModel,
    private readonly _folderConfigurations: Map<string, ConfigurationModel>,
    private readonly _memoryConfigurationModel: ConfigurationModel,
    private readonly _memoryConfigurationByResource: Map<string, ConfigurationModel>,
    private readonly logService: ILogger,
  ) {
    this._defaultConfiguration = _defaultConfigurationModel;
    this._init();
  }

  private _init(): void {
    this._policyConfiguration = this._policyConfigurationModel;
    this._applicationConfiguration = this._applicationConfigurationModel;
    this._localUserConfiguration = this._localUserConfigurationModel;
    this._remoteUserConfiguration = this._remoteUserConfigurationModel;
    this._workspaceConfiguration = this._workspaceConfigurationModel;
  }

  getValue(section: string | undefined, overrides: IConfigurationOverrides): unknown {
    return this.getConsolidatedConfigurationModel(section, overrides).getValue(section);
  }

  inspect<C>(key: string, overrides: IConfigurationOverrides): IConfigurationValue<C> {
    const consolidateConfigurationModel = this.getConsolidatedConfigurationModel(key, overrides);
    const folderConfigurationModel = this.getFolderConfigurationModelForResource(overrides.resource);
    const defaultValue = overrides.overrideIdentifier ? this._defaultConfiguration.override(overrides.overrideIdentifier).inspect<C>(key) : this._defaultConfiguration.inspect<C>(key);
    const policyValue = this._policyConfiguration.isEmpty() ? undefined : this._policyConfiguration.inspect<C>(key).value;
    const applicationValue = this._applicationConfiguration.isEmpty() ? undefined : this._applicationConfiguration.inspect<C>(key).value;
    const userValue = this._localUserConfiguration.inspect<C>(key).value;
    const userLocalValue = this._localUserConfiguration.inspect<C>(key).value;
    const userRemoteValue = this._remoteUserConfiguration.inspect<C>(key).value;
    const workspaceValue = this._workspaceConfiguration.inspect<C>(key).value;
    const workspaceFolderValue = folderConfigurationModel ? folderConfigurationModel.inspect<C>(key).value : undefined;
    const memoryValue = this._memoryConfigurationModel.inspect<C>(key).value;
    const value = consolidateConfigurationModel.inspect<C>(key);
    const overrideIdentifiers = arrays.distinct(this._defaultConfiguration.getAllOverrideIdentifiers().concat(this._localUserConfiguration.getAllOverrideIdentifiers()).concat(this._workspaceConfiguration.getAllOverrideIdentifiers()));
    return {
      defaultValue: defaultValue.merged,
      policyValue,
      applicationValue,
      userValue,
      userLocalValue,
      userRemoteValue,
      workspaceValue,
      workspaceFolderValue,
      memoryValue,
      value: value.merged,

      default: defaultValue,
      policy: policyValue !== undefined ? { value: policyValue } : undefined,
      application: applicationValue !== undefined ? { value: applicationValue } : undefined,
      user: userValue !== undefined ? { value: userValue } : undefined,
      userLocal: userLocalValue !== undefined ? { value: userLocalValue } : undefined,
      userRemote: userRemoteValue !== undefined ? { value: userRemoteValue } : undefined,
      workspace: workspaceValue !== undefined ? { value: workspaceValue } : undefined,
      workspaceFolder: workspaceFolderValue !== undefined ? { value: workspaceFolderValue } : undefined,
      memory: memoryValue !== undefined ? { value: memoryValue } : undefined,
      overrideIdentifiers: overrideIdentifiers.length ? overrideIdentifiers : undefined,
    };
  }

  keys(): {
    default: string[];
    policy: string[];
    user: string[];
    workspace: string[];
    workspaceFolder: string[];
  } {
    const user = this._localUserConfiguration.keys;
    const workspace = this._workspaceConfiguration.keys;
    const workspaceFolder: string[] = [];
    for (const folderConfiguration of this._folderConfigurations.values()) {
      for (const key of folderConfiguration.keys) {
        workspaceFolder.push(key);
      }
    }
    return {
      default: this._defaultConfiguration.keys,
      policy: this._policyConfiguration.keys,
      user,
      workspace,
      workspaceFolder: arrays.distinct(workspaceFolder),
    };
  }

  compareAndUpdateDefaultConfiguration(defaults: ConfigurationModel, properties: string[]): IConfigurationChange {
    const { added, removed, updated } = compare(this._defaultConfiguration, defaults);
    const overrides: [string, string[]][] = [];
    const keys = [...added, ...removed, ...updated];
    if (properties.length) {
      keys.push(...properties.filter(key => !keys.includes(key)));
    }
    if (keys.length) {
      const allOverrideIdentifiers = [...defaults.getAllOverrideIdentifiers()];
      for (const key of keys) {
        for (const identifier of allOverrideIdentifiers) {
          const inDefault = this._defaultConfiguration.getKeysForOverrideIdentifier(identifier).includes(key);
          const inCurrent = defaults.getKeysForOverrideIdentifier(identifier).includes(key);
          if (inDefault !== inCurrent) {
            overrides.push([key, [identifier]]);
          }
        }
      }
    }
    this._defaultConfiguration = defaults;
    return { added, removed, updated, overrides, keys: [...added, ...removed, ...updated] };
  }

  compareAndUpdatePolicyConfiguration(policyConfiguration: ConfigurationModel): IConfigurationChange {
    const { added, removed, updated } = compare(this._policyConfiguration, policyConfiguration);
    return { added, removed, updated, overrides: [], keys: [...added, ...removed, ...updated] };
  }

  compareAndUpdateApplicationConfiguration(applicationConfiguration: ConfigurationModel): IConfigurationChange {
    const { added, removed, updated } = compare(this._applicationConfiguration, applicationConfiguration);
    return { added, removed, updated, overrides: [], keys: [...added, ...removed, ...updated] };
  }

  compareAndUpdateLocalUserConfiguration(userConfiguration: ConfigurationModel): IConfigurationChange {
    const { added, removed, updated } = compare(this._localUserConfiguration, userConfiguration);
    return { added, removed, updated, overrides: [], keys: [...added, ...removed, ...updated] };
  }

  compareAndUpdateRemoteUserConfiguration(userConfiguration: ConfigurationModel): IConfigurationChange {
    const { added, removed, updated } = compare(this._remoteUserConfiguration, userConfiguration);
    return { added, removed, updated, overrides: [], keys: [...added, ...removed, ...updated] };
  }

  compareAndUpdateWorkspaceConfiguration(workspaceConfiguration: ConfigurationModel): IConfigurationChange {
    const { added, removed, updated } = compare(this._workspaceConfiguration, workspaceConfiguration);
    return { added, removed, updated, overrides: [], keys: [...added, ...removed, ...updated] };
  }

  compareAndUpdateFolderConfiguration(resource: string, folderConfiguration: ConfigurationModel): IConfigurationChange {
    const current = this._folderConfigurations.get(resource);
    if (!current) {
      this._folderConfigurations.set(resource, folderConfiguration);
      return { added: folderConfiguration.keys, removed: [], updated: [], overrides: [], keys: folderConfiguration.keys };
    }
    const { added, removed, updated } = compare(current, folderConfiguration);
    this._folderConfigurations.set(resource, folderConfiguration);
    return { added, removed, updated, overrides: [], keys: [...added, ...removed, ...updated] };
  }

  compareAndDeleteFolderConfiguration(resource: string): IConfigurationChange {
    const folderConfiguration = this._folderConfigurations.get(resource);
    if (!folderConfiguration) {
      return { added: [], removed: [], updated: [], overrides: [], keys: [] };
    }
    this._folderConfigurations.delete(resource);
    return { added: [], removed: [...folderConfiguration.keys], updated: [], overrides: [], keys: [...folderConfiguration.keys] };
  }

  compare(other: Configuration): IConfigurationCompareResult {
    const result = compare(this._defaultConfiguration, other._defaultConfiguration);
    for (const key of other._policyConfiguration.keys) {
      if (!result.added.includes(key) && !result.removed.includes(key) && !result.updated.includes(key)) {
        result.updated.push(key);
      }
    }
    for (const key of other._applicationConfiguration.keys) {
      if (!result.added.includes(key) && !result.removed.includes(key) && !result.updated.includes(key)) {
        result.updated.push(key);
      }
    }
    for (const key of other._localUserConfiguration.keys) {
      if (!result.added.includes(key) && !result.removed.includes(key) && !result.updated.includes(key)) {
        result.updated.push(key);
      }
    }
    for (const key of other._workspaceConfiguration.keys) {
      if (!result.added.includes(key) && !result.removed.includes(key) && !result.updated.includes(key)) {
        result.updated.push(key);
      }
    }
    for (const folderConfiguration of other._folderConfigurations.values()) {
      for (const key of folderConfiguration.keys) {
        if (!result.added.includes(key) && !result.removed.includes(key) && !result.updated.includes(key)) {
          result.updated.push(key);
        }
      }
    }
    return result;
  }

  private getConsolidatedConfigurationModel(section: string | undefined, overrides: IConfigurationOverrides): ConfigurationModel {
    let consolidateConfiguration = this._defaultConfiguration
      .merge(this._policyConfiguration)
      .merge(this._applicationConfiguration)
      .merge(this._localUserConfiguration)
      .merge(this._workspaceConfiguration);

    const folderConfigurationModel = this.getFolderConfigurationModelForResource(overrides.resource);
    if (folderConfigurationModel) {
      consolidateConfiguration = consolidateConfiguration.merge(folderConfigurationModel);
    }

    consolidateConfiguration = consolidateConfiguration.merge(this._memoryConfigurationModel);

    if (overrides.overrideIdentifier) {
      return consolidateConfiguration.override(overrides.overrideIdentifier);
    }

    return consolidateConfiguration;
  }

  private getFolderConfigurationModelForResource(resource: URI | null | undefined): ConfigurationModel | undefined {
    if (!resource) {
      return undefined;
    }
    return this._folderConfigurations.get(resource.toString());
  }

  toData(): IConfigurationData {
    return {
      defaults: this._defaultConfiguration.toJSON(),
      policy: this._policyConfiguration.toJSON(),
      application: this._applicationConfiguration.toJSON(),
      userLocal: this._localUserConfiguration.toJSON(),
      userRemote: this._remoteUserConfiguration.toJSON(),
      workspace: this._workspaceConfiguration.toJSON(),
      folders: [...this._folderConfigurations.entries()].map(([resource, model]) => [URI.parse(resource), model.toJSON()]),
    };
  }

  allKeys(): string[] {
    const keys: Set<string> = new Set<string>();
    this._defaultConfiguration.keys.forEach(key => keys.add(key));
    this._policyConfiguration.keys.forEach(key => keys.add(key));
    this._applicationConfiguration.keys.forEach(key => keys.add(key));
    this._localUserConfiguration.keys.forEach(key => keys.add(key));
    this._remoteUserConfiguration.keys.forEach(key => keys.add(key));
    this._workspaceConfiguration.keys.forEach(key => keys.add(key));
    this._folderConfigurations.forEach(folderConfiguration => folderConfiguration.keys.forEach(key => keys.add(key)));
    return [...keys.values()];
  }

  overrideIdentifiers(): string[] {
    const keys: Set<string> = new Set<string>();
    this._defaultConfiguration.getAllOverrideIdentifiers().forEach(key => keys.add(key));
    this._localUserConfiguration.getAllOverrideIdentifiers().forEach(key => keys.add(key));
    this._workspaceConfiguration.getAllOverrideIdentifiers().forEach(key => keys.add(key));
    return [...keys.values()];
  }
}

export class ConfigurationChangeEvent implements IConfigurationChangeEvent {
  source: ConfigurationTarget = ConfigurationTarget.DEFAULT;
  readonly affectedKeys = new Set<string>();

  private readonly _previous?: { data: IConfigurationData } | undefined;
  private readonly _current: Configuration;
  private _changedConfiguration?: ConfigurationModel;
  private _changedConfigurationByResource?: Map<string, ConfigurationModel>;

  constructor(
    private readonly _change: IConfigurationChange,
    private readonly previous: { data: IConfigurationData } | undefined,
    private readonly currentConfiguraiton: Configuration,
    private readonly currentWorkspace?: unknown,
    private readonly logService?: ILogger,
  ) {
    this._previous = previous;
    this._current = currentConfiguraiton;
  }

  get change(): IConfigurationChange {
    return {
      keys: this.affectedKeys.size ? [...this.affectedKeys.values()] : this._change.keys,
      overrides: this._change.overrides,
      added: this._change.added,
      removed: this._change.removed,
      updated: this._change.updated,
    };
  }

  affectsConfiguration(configuration: string, overrides?: IConfigurationOverrides): boolean {
    if (this.affectedKeys.size === 0) {
      return false;
    }

    if (this.doesChangeContains(this.affectedKeys, configuration)) {
      if (overrides) {
        const changedKeys = this.change.overrides.filter(([key]) => this.doesChangeContains([key], configuration));
        if (changedKeys.length > 0) {
          return changedKeys.some(([, identifiers]) => overrides.overrideIdentifier ? identifiers.includes(overrides.overrideIdentifier) : true);
        }
      }
      return true;
    }

    return false;
  }

  private doesChangeContains(change: string[] | Set<string>, configuration: string): boolean {
    for (const key of change) {
      if (configuration === key || key.startsWith(`${configuration}.`)) {
        return true;
      }
    }
    return false;
  }

  private getChangedConfiguration(): ConfigurationModel {
    if (!this._changedConfiguration) {
      this._changedConfiguration = new ConfigurationModel({}, [], [], undefined, this.logService || { error: () => {} } as any);
      this.change.keys.forEach(key => this._changedConfiguration!.setValue(key, {}));
    }
    return this._changedConfiguration;
  }

  private getChangedConfigurationByResource(): Map<string, ConfigurationModel> {
    if (!this._changedConfigurationByResource) {
      const changedConfigurationByResource = new Map<string, ConfigurationModel>();
      // Simplified: not handling workspace folders for MVP
      this._changedConfigurationByResource = changedConfigurationByResource;
    }
    return this._changedConfigurationByResource;
  }
}

function compare(from: ConfigurationModel, to: ConfigurationModel): IConfigurationCompareResult {
  const added = to.keys.filter(key => !from.keys.includes(key));
  const removed = from.keys.filter(key => !to.keys.includes(key));
  const updated: string[] = [];

  for (const key of from.keys) {
    const index = to.keys.indexOf(key);
    if (index !== -1) {
      const fromValue = from.getValue(key);
      const toValue = to.getValue(key);
      if (!objects.equals(fromValue, toValue)) {
        updated.push(key);
      }
    }
  }

  return { added, removed, updated, overrides: [], keys: [...added, ...removed, ...updated] };
}

export class WorkspaceSettings extends Disposable {
  private readonly _onDidChange: Emitter<void> = this._register(new Emitter<void>());
  readonly onDidChange: Event<void> = this._onDidChange.event;

  private readonly parser: ConfigurationModelParser;
  private readonly parseOptions: ConfigurationParseOptions;
  private _configurationModel: ConfigurationModel = ConfigurationModel.createEmptyModel({ error: () => {} } as any);

  constructor(
    private readonly settingsResource: URI,
    parseOptions: ConfigurationParseOptions,
    private readonly fileService: IFileService,
    private readonly logService: ILogger,
  ) {
    super();
    this.parser = new ConfigurationModelParser(this.settingsResource.toString(), logService);
    this.parseOptions = parseOptions;
  }

  async loadConfiguration(): Promise<ConfigurationModel> {
    try {
      const content = await this.fileService.readFile(this.settingsResource);
      this.parser.parse(content.value.toString(), this.parseOptions);
    }
    catch {
      this.parser.parse("{}", this.parseOptions);
    }
    this._configurationModel = this.parser.configurationModel;
    return this._configurationModel;
  }

  reparse(parseOptions: ConfigurationParseOptions): ConfigurationModel {
    this.parser.reparse(parseOptions);
    this._configurationModel = this.parser.configurationModel;
    return this._configurationModel;
  }

  get configurationModel(): ConfigurationModel {
    return this._configurationModel;
  }
}

export class UserSettings extends Disposable {
  private readonly _onDidChange: Emitter<void> = this._register(new Emitter<void>());
  readonly onDidChange: Event<void> = this._onDidChange.event;

  private readonly parser: ConfigurationModelParser;
  private readonly parseOptions: ConfigurationParseOptions;
  private _configurationModel: ConfigurationModel = ConfigurationModel.createEmptyModel({ error: () => {} } as any);

  constructor(
    private readonly settingsResource: URI,
    parseOptions: ConfigurationParseOptions,
    private readonly fileService: IFileService,
    private readonly logService: ILogger,
  ) {
    super();
    this.parser = new ConfigurationModelParser(this.settingsResource.toString(), logService);
    this.parseOptions = parseOptions;
  }

  async loadConfiguration(): Promise<ConfigurationModel> {
    try {
      const content = await this.fileService.readFile(this.settingsResource);
      this.parser.parse(content.value.toString(), this.parseOptions);
    }
    catch (e) {
      this.logService.error(String(e));
      this.parser.parse("{}", this.parseOptions);
    }
    this._configurationModel = this.parser.configurationModel;
    return this._configurationModel;
  }

  reparse(parseOptions: ConfigurationParseOptions): ConfigurationModel {
    this.parser.reparse(parseOptions);
    this._configurationModel = this.parser.configurationModel;
    return this._configurationModel;
  }

  get configurationModel(): ConfigurationModel {
    return this._configurationModel;
  }
}
