import type { JSX } from 'solid-js'
import type { StyleVars } from '../../utils/styleVars'

export interface StyleProviderProps {
  styleVars?: StyleVars | null
  as?: keyof JSX.IntrinsicElements
  class?: string
  children?: JSX.Element
}
