import type { IKeyboardMapper } from './keyboard-mapper'

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

  // readonly onDidChangeKeyboardLayout: Event<void>

  // getRawKeyboardMapping: () => IKeyboardMapping | null
  // getCurrentKeyboardLayout: () => IKeyboardLayoutInfo | null
  // getAllKeyboardLayouts: () => IKeyboardLayoutInfo[]
  getKeyboardMapper: () => IKeyboardMapper
  // validateCurrentKeyboardMapping: (keyboardEvent: KeyboardEvent) => void
}
