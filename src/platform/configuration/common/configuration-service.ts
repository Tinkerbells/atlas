/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { Event } from "@core/base/event";
import type { URI } from "@platform/common/uri/uri";
import type { IDisposable } from "@core/base/lifecycle";
import type { FormattingOptions, ParseError } from "jsonc-parser";
import type { FileOperationError } from "@platform/files/common/files";

import { Emitter } from "@core/base/event";
import { equals } from "@core/base/objects";
import { isLinux } from "@core/base/platform";
import { Disposable } from "@core/base/lifecycle";
import { ILogger } from "@platform/logger/common/logger";
import { applyEdits, modify, parse } from "jsonc-parser";
import { AsyncQueue, RunOnceScheduler } from "@core/base/async";
import { FileOperationResult, IFileService } from "@platform/files/common/files";

import type { IPolicyConfiguration } from "./configurations";
import type { IConfigurationChange, IConfigurationChangeEvent, IConfigurationData, IConfigurationOverrides, IConfigurationService, IConfigurationUpdateOverrides, IConfigurationValue, IWorkspaceFolder } from "./configuration";

import { keyFromOverrideIdentifiers } from "./configuration-registry";
import { DefaultConfiguration, NullPolicyConfiguration } from "./configurations";
import { ConfigurationTarget, isConfigurationOverrides, isConfigurationUpdateOverrides } from "./configuration";
import { Configuration, ConfigurationChangeEvent, ConfigurationModel, UserSettings, WorkspaceSettings } from "./configuration-models";

export { IConfigurationService } from "./configuration";

export class ConfigurationService extends Disposable implements IConfigurationService, IDisposable {
  declare readonly _serviceBrand: undefined;

  private configuration: Configuration;
  private readonly defaultConfiguration: DefaultConfiguration;
  private readonly policyConfiguration: IPolicyConfiguration;
  private readonly userConfiguration: UserSettings;
  private workspaceConfiguration: WorkspaceSettings | undefined;
  private readonly reloadConfigurationScheduler: RunOnceScheduler;

  private readonly _onDidChangeConfiguration: Emitter<IConfigurationChangeEvent> = this._register(new Emitter<IConfigurationChangeEvent>());
  readonly onDidChangeConfiguration: Event<IConfigurationChangeEvent> = this._onDidChangeConfiguration.event;

  private readonly configurationEditing: ConfigurationEditing;

  constructor(
    private readonly settingsResource: URI,
    @IFileService private readonly fileService: IFileService,
    @ILogger private readonly logService: ILogger,
    private workspaceSettingsResource?: URI,
  ) {
    super();
    this.defaultConfiguration = this._register(new DefaultConfiguration(logService));
    this.policyConfiguration = new NullPolicyConfiguration();
    this.userConfiguration = this._register(new UserSettings(this.settingsResource, {}, fileService, logService));
    if (this.workspaceSettingsResource) {
      this.workspaceConfiguration = this._register(new WorkspaceSettings(this.workspaceSettingsResource, {}, fileService, logService));
    }
    this.configuration = new Configuration(
      this.defaultConfiguration.configurationModel,
      this.policyConfiguration.configurationModel,
      ConfigurationModel.createEmptyModel(logService),
      ConfigurationModel.createEmptyModel(logService),
      ConfigurationModel.createEmptyModel(logService),
      ConfigurationModel.createEmptyModel(logService),
      new Map<string, ConfigurationModel>(),
      ConfigurationModel.createEmptyModel(logService),
      new Map<string, ConfigurationModel>(),
      logService,
    );
    this.configurationEditing = new ConfigurationEditing(settingsResource, fileService, this);

    this.reloadConfigurationScheduler = this._register(new RunOnceScheduler(() => this.reloadConfiguration(), 50));
    this._register(this.defaultConfiguration.onDidChangeConfiguration(({ defaults, properties }) => this.onDidDefaultConfigurationChange(defaults, properties)));
    this._register(this.userConfiguration.onDidChange(() => this.reloadConfigurationScheduler.schedule()));
  }

  async initialize(): Promise<void> {
    const promises: Promise<ConfigurationModel>[] = [
      this.defaultConfiguration.initialize(),
      this.policyConfiguration.initialize(),
      this.userConfiguration.loadConfiguration(),
    ];
    if (this.workspaceConfiguration) {
      promises.push(this.workspaceConfiguration.loadConfiguration());
    }
    const [defaultModel, policyModel, userModel, workspaceModel] = await Promise.all(promises);
    this.configuration = new Configuration(
      defaultModel,
      policyModel,
      ConfigurationModel.createEmptyModel(this.logService),
      userModel,
      ConfigurationModel.createEmptyModel(this.logService),
      workspaceModel || ConfigurationModel.createEmptyModel(this.logService),
      new Map<string, ConfigurationModel>(),
      ConfigurationModel.createEmptyModel(this.logService),
      new Map<string, ConfigurationModel>(),
      this.logService,
    );
  }

  setWorkspaceSettingsResource(resource: URI | undefined): void {
    if (this.workspaceConfiguration) {
      this.workspaceConfiguration.dispose();
    }
    this.workspaceSettingsResource = resource;
    if (resource) {
      this.workspaceConfiguration = this._register(new WorkspaceSettings(resource, {}, this.fileService, this.logService));
      this.reloadConfigurationScheduler.schedule();
    }
    else {
      this.workspaceConfiguration = undefined;
      this.reloadConfigurationScheduler.schedule();
    }
  }

  getConfigurationData(): IConfigurationData {
    return this.configuration.toData();
  }

  getValue<T>(): T;
  getValue<T>(section: string): T;
  getValue<T>(overrides: IConfigurationOverrides): T;
  getValue<T>(section: string, overrides: IConfigurationOverrides): T;
  getValue(arg1?: unknown, arg2?: unknown): unknown {
    const section = typeof arg1 === "string" ? arg1 : undefined;
    const overrides = isConfigurationOverrides(arg1) ? arg1 : isConfigurationOverrides(arg2) ? arg2 : {};
    return this.configuration.getValue(section, overrides);
  }

  updateValue(key: string, value: unknown): Promise<void>;
  updateValue(key: string, value: unknown, overrides: IConfigurationOverrides | IConfigurationUpdateOverrides): Promise<void>;
  updateValue(key: string, value: unknown, target: ConfigurationTarget): Promise<void>;
  updateValue(key: string, value: unknown, arg3?: unknown, arg4?: unknown, _options?: unknown): Promise<void> {
    const overrides: IConfigurationUpdateOverrides | undefined = isConfigurationUpdateOverrides(arg3)
      ? arg3
      : isConfigurationOverrides(arg3) ? { resource: arg3.resource, overrideIdentifiers: arg3.overrideIdentifier ? [arg3.overrideIdentifier] : undefined } : undefined;

    const target: ConfigurationTarget | undefined = (overrides ? arg4 : arg3) as ConfigurationTarget | undefined;
    if (target !== undefined) {
      if (target !== ConfigurationTarget.USER_LOCAL && target !== ConfigurationTarget.USER) {
        throw new Error(`Unable to write ${key} to target ${target}.`);
      }
    }

    if (overrides?.overrideIdentifiers) {
      overrides.overrideIdentifiers = [...new Set(overrides.overrideIdentifiers)];
      overrides.overrideIdentifiers = overrides.overrideIdentifiers.length ? overrides.overrideIdentifiers : undefined;
    }

    const inspect = this.inspect(key, { resource: overrides?.resource, overrideIdentifier: overrides?.overrideIdentifiers ? overrides.overrideIdentifiers[0] : undefined });
    if (inspect.policyValue !== undefined) {
      throw new Error(`Unable to write ${key} because it is configured in system policy.`);
    }

    // Remove the setting, if the value is same as default value
    if (equals(value, inspect.defaultValue)) {
      value = undefined;
    }

    const path = overrides?.overrideIdentifiers?.length ? [keyFromOverrideIdentifiers(overrides.overrideIdentifiers), key] : [key];

    return this.configurationEditing.write(path, value).then(() => this.reloadConfiguration());
  }

  inspect<T>(key: string, overrides: IConfigurationOverrides = {}): IConfigurationValue<T> {
    return this.configuration.inspect<T>(key, overrides);
  }

  keys(): {
    default: string[];
    policy: string[];
    user: string[];
    workspace: string[];
    workspaceFolder: string[];
  } {
    return this.configuration.keys();
  }

  async reloadConfiguration(_target?: ConfigurationTarget | IWorkspaceFolder): Promise<void> {
    const userModel = await this.userConfiguration.loadConfiguration();
    this.onDidChangeUserConfiguration(userModel);
    if (this.workspaceConfiguration) {
      const workspaceModel = await this.workspaceConfiguration.loadConfiguration();
      this.onDidChangeWorkspaceConfiguration(workspaceModel);
    }
  }

  private onDidChangeWorkspaceConfiguration(workspaceConfigurationModel: ConfigurationModel): void {
    const previous = this.configuration.toData();
    const change = this.configuration.compareAndUpdateWorkspaceConfiguration(workspaceConfigurationModel);
    this.trigger(change, previous, ConfigurationTarget.WORKSPACE);
  }

  private onDidChangeUserConfiguration(userConfigurationModel: ConfigurationModel): void {
    const previous = this.configuration.toData();
    const change = this.configuration.compareAndUpdateLocalUserConfiguration(userConfigurationModel);
    this.trigger(change, previous, ConfigurationTarget.USER);
  }

  private onDidDefaultConfigurationChange(defaultConfigurationModel: ConfigurationModel, properties: string[]): void {
    const previous = this.configuration.toData();
    const change = this.configuration.compareAndUpdateDefaultConfiguration(defaultConfigurationModel, properties);
    this.trigger(change, previous, ConfigurationTarget.DEFAULT);
  }

  private trigger(configurationChange: IConfigurationChange, previous: IConfigurationData, source: ConfigurationTarget): void {
    const event = new ConfigurationChangeEvent(configurationChange, { data: previous }, this.configuration, undefined, this.logService);
    event.source = source;
    this._onDidChangeConfiguration.fire(event);
  }
}

class ConfigurationEditing {
  private readonly queue: AsyncQueue<void>;

  constructor(
    private readonly settingsResource: URI,
    private readonly fileService: IFileService,
    private readonly configurationService: ConfigurationService,
  ) {
    this.queue = new AsyncQueue<void>();
  }

  write(path: string[], value: unknown): Promise<void> {
    return this.queue.enqueue(() => this.doWriteConfiguration(path, value));
  }

  private async doWriteConfiguration(path: string[], value: unknown): Promise<void> {
    let content: string;
    try {
      content = await this.fileService.readFile(this.settingsResource);
    }
    catch (error) {
      if ((<FileOperationError>error).fileOperationResult === FileOperationResult.FILE_NOT_FOUND) {
        content = "{}";
      }
      else {
        throw error;
      }
    }

    const parseErrors: ParseError[] = [];
    parse(content, parseErrors, { allowTrailingComma: true, allowEmptyContent: true });
    if (parseErrors.length > 0) {
      throw new Error("Unable to write into the settings file. Please open the file to correct errors/warnings in the file and try again.");
    }

    const edits = this.getEdits(content, path, value);
    content = applyEdits(content, edits);

    await this.fileService.writeFile(this.settingsResource, content);
  }

  private getEdits(content: string, path: string[], value: unknown): any[] {
    const { tabSize, insertSpaces, eol } = this.formattingOptions;

    // With empty path the entire file is being replaced, so we just use JSON.stringify
    if (!path.length) {
      const newContent = JSON.stringify(value, null, insertSpaces ? " ".repeat(tabSize ?? 4) : "\t");
      return [{
        content: newContent,
        length: content.length,
        offset: 0,
      }];
    }

    return modify(content, path, value, { formattingOptions: { tabSize: tabSize ?? 4, insertSpaces, eol } });
  }

  private _formattingOptions: FormattingOptions | undefined;
  private get formattingOptions(): FormattingOptions {
    if (!this._formattingOptions) {
      let eol = isLinux ? "\n" : "\r\n";
      const configuredEol = this.configurationService.getValue("files.eol", { overrideIdentifier: "jsonc" });
      if (configuredEol && typeof configuredEol === "string" && configuredEol !== "auto") {
        eol = configuredEol;
      }
      this._formattingOptions = {
        eol,
        insertSpaces: !!this.configurationService.getValue("editor.insertSpaces", { overrideIdentifier: "jsonc" }),
        tabSize: this.configurationService.getValue("editor.tabSize", { overrideIdentifier: "jsonc" }),
      };
    }
    return this._formattingOptions;
  }
}
