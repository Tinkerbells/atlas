import type { IKeyboardMapper } from './keyboard-mapper'
import type { IKeyboardLayoutService } from './keyboard-layout'

import { Disposable } from '../lifecycle/dispose'
import { KeyboardMapper } from './keyboard-mapper'
import { OperatingSystem } from '../platform/platform'

export class BrowserKeyboardLayoutService extends Disposable implements IKeyboardLayoutService {
  public _serviceBrand: undefined

  // private readonly _onDidChangeKeyboardLayout = new Emitter<void>()
  // public readonly onDidChangeKeyboardLayout: Event<void> = this._onDidChangeKeyboardLayout.event

  // private _userKeyboardLayout: UserKeyboardLayout

  constructor() {
    super()
  }

  getKeyboardMapper(): IKeyboardMapper {
    return new KeyboardMapper(OperatingSystem.Macintosh)
  }

  public validateCurrentKeyboardMapping() {

  }

  // public getCurrentKeyboardLayout(): IKeyboardLayoutInfo | null {
  //   return this._factory.activeKeyboardLayout
  // }
  //
  // public getAllKeyboardLayouts(): IKeyboardLayoutInfo[] {
  //   return this._factory.keyboardLayouts
  // }
  //
  // public getRawKeyboardMapping(): IKeyboardMapping | null {
  //   return this._factory.activeKeyMapping
  // }
}
