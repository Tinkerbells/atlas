import { createContext, useContext } from 'solid-js'
import type { ButtonMode, ButtonGroupSize, ButtonGroupType } from './props'

export interface ButtonGroupContextValue {
  type: () => ButtonGroupType
  size: () => ButtonGroupSize
  color: () => string | undefined
  textColor: () => string | undefined
  mode: () => ButtonMode
  elevation: () => boolean | number | string | undefined
}

const ButtonGroupContext = createContext<ButtonGroupContextValue>()

export function ButtonGroupProvider(props: { value: ButtonGroupContextValue; children: any }) {
  return <ButtonGroupContext.Provider value={props.value}>{props.children}</ButtonGroupContext.Provider>
}

export function useButtonGroupContext() {
  return useContext(ButtonGroupContext)
}
