import { Disposable } from "@atlas/shared";
import { InstantiationType, registerSingleton } from "@atlas/di";
import { getHome, getNodeBinary, spawnProcess, spawnStream } from "@atlas/electron-preload";

import type { SpawnStreamHandle } from "./types";

import { INodeProcess } from "./types";
import { ILogger } from "../logger/logger";

export class NodeProcessService extends Disposable implements INodeProcess {
  declare readonly _serviceBrand: undefined;

  constructor(
    @ILogger private _logger: ILogger,
  ) {
    super();
  }

  async spawn(options: { command: string; args: string[]; cwd: string }) {
    this._logger.info(`spawn: ${options.command} ${options.args.join(" ")} (cwd: ${options.cwd})`, {
      scope: "NodeProcess",
    });

    const result = await spawnProcess(options);

    this._logger.info(`spawn: code=${result.code}, stdout=${result.stdout.length}chars, stderr=${result.stderr.length}chars`, {
      scope: "NodeProcess",
    });

    return result;
  }

  async spawnStream(options: { command: string; args: string[]; cwd: string }): Promise<SpawnStreamHandle> {
    this._logger.info(`spawnStream: ${options.command} ${options.args.join(" ")} (cwd: ${options.cwd})`, {
      scope: "NodeProcess",
    });

    const handle = await spawnStream(options);

    this._logger.info(`spawnStream: processId=${handle.processId}`, { scope: "NodeProcess" });

    return handle;
  }

  async getBinary(name: string): Promise<string> {
    const path = await getNodeBinary(name);
    this._logger.info(`getBinary("${name}"): ${path}`, { scope: "NodeProcess" });
    if (!path) {
      throw new Error(`Binary "${name}" not found`);
    }
    return path;
  }

  async getHome(): Promise<string> {
    const home = await getHome();
    this._logger.info(`getHome: ${home}`, { scope: "NodeProcess" });
    return home;
  }
}

registerSingleton(INodeProcess, NodeProcessService, InstantiationType.Eager);
