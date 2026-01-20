import { commandsRegistry } from './commands'
import { Disposable } from '../lifecycle/dispose'

export interface ICommandService {
  // readonly onWillExecuteCommand: Event<ICommandEvent>
  // readonly onDidExecuteCommand: Event<ICommandEvent>
  executeCommand: <R = unknown>(commandId: string, ...args: unknown[]) => Promise<R | undefined>
}

export class CommandService extends Disposable implements ICommandService {
  // private readonly _onWillExecuteCommand: Emitter<ICommandEvent> = this._register(new Emitter<ICommandEvent>())
  // public readonly onWillExecuteCommand: Event<ICommandEvent> = this._onWillExecuteCommand.event
  //
  // private readonly _onDidExecuteCommand: Emitter<ICommandEvent> = new Emitter<ICommandEvent>()
  // public readonly onDidExecuteCommand: Event<ICommandEvent> = this._onDidExecuteCommand.event

  constructor(
  ) {
    super()
  }

  async executeCommand<T>(id: string, ...args: unknown[]): Promise<T> {
    return this._tryExecuteCommand(id, args)
  }

  private _tryExecuteCommand(id: string, args: unknown[]): Promise<any> {
    const command = commandsRegistry.getCommand(id)
    if (!command) {
      return Promise.reject(new Error(`command '${id}' not found`))
    }
    try {
      // this._onWillExecuteCommand.fire({ commandId: id, args })
      // const result = this._instantiationService.invokeFunction(command.handler, ...args)
      // this._onDidExecuteCommand.fire({ commandId: id, args })
      // WARN: пока простой вызов, позже будет DI
      const result = command.handler(...args)
      return Promise.resolve(result)
    }
    catch (err) {
      return Promise.reject(err)
    }
  }

  public override dispose(): void {
    super.dispose()
  }
}
