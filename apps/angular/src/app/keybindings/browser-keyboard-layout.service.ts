import { inject, Injectable, InjectionToken } from '@angular/core'

import type { IKeyboardMapper } from './keyboard-mapper'

import { KeyboardMapper } from './keyboard-mapper'
import { OperatingSystem } from '~/platform'

export interface IWindowsKeyMapping {
  vkey: string
  value: string
  withShift: string
  withAltGr: string
  withShiftAltGr: string
}
export interface IWindowsKeyboardMapping {
  [code: string]: IWindowsKeyMapping
}
export interface ILinuxKeyMapping {
  value: string
  withShift: string
  withAltGr: string
  withShiftAltGr: string
}
export interface ILinuxKeyboardMapping {
  [code: string]: ILinuxKeyMapping
}
export interface IMacKeyMapping {
  value: string
  valueIsDeadKey: boolean
  withShift: string
  withShiftIsDeadKey: boolean
  withAltGr: string
  withAltGrIsDeadKey: boolean
  withShiftAltGr: string
  withShiftAltGrIsDeadKey: boolean
}
export interface IMacKeyboardMapping {
  [code: string]: IMacKeyMapping
}

export type IMacLinuxKeyMapping = IMacKeyMapping | ILinuxKeyMapping
export type IMacLinuxKeyboardMapping = IMacKeyboardMapping | ILinuxKeyboardMapping
export type IKeyboardMapping = IWindowsKeyboardMapping | ILinuxKeyboardMapping | IMacKeyboardMapping

export interface IWindowsKeyboardLayoutInfo {
  name: string
  id: string
  text: string
}

export interface ILinuxKeyboardLayoutInfo {
  model: string
  group: number
  layout: string
  variant: string
  options: string
  rules: string
}

export interface IMacKeyboardLayoutInfo {
  id: string
  lang: string
  localizedName?: string
}

export type IKeyboardLayoutInfo = (IWindowsKeyboardLayoutInfo | ILinuxKeyboardLayoutInfo | IMacKeyboardLayoutInfo) & { isUserKeyboardLayout?: boolean, isUSStandard?: true }

export interface IKeyboardLayoutService {

  readonly _serviceBrand: undefined

  getKeyboardMapper: () => IKeyboardMapper
}

export const IKeyboardLayoutService = new InjectionToken<IKeyboardLayoutService>("IKeyboardLayoutService", {
  providedIn: 'root',
  factory: () => inject(BrowserKeyboardLayoutService)
})


@Injectable({
  providedIn: 'root',
})
export class BrowserKeyboardLayoutService implements IKeyboardLayoutService {
  public _serviceBrand: undefined

  constructor() { }

  getKeyboardMapper(): IKeyboardMapper {
    return new KeyboardMapper(OperatingSystem.Macintosh, false)
  }

  public validateCurrentKeyboardMapping() {

  }
}
