export type ButtonGroupType = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'danger'
export type ButtonGroupSize = 'normal' | 'mini' | 'small' | 'large'
export type ButtonMode = 'text' | 'outline' | 'normal' | 'icon-container'

export interface ButtonGroupProps {
  type?: ButtonGroupType
  size?: ButtonGroupSize
  color?: string
  textColor?: string
  mode?: ButtonMode
  elevation?: boolean | number | string
  vertical?: boolean
  class?: string
  children?: any
}
