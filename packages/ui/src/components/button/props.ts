import type { JSX } from 'solid-js'

export type ButtonType = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'danger'
export type ButtonSize = 'mini' | 'small' | 'normal' | 'large'

type NativeButtonProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'color'>

export interface ButtonProps extends NativeButtonProps {
  type?: ButtonType
  size?: ButtonSize
  loading?: boolean
  autoLoading?: boolean
  round?: boolean
  block?: boolean
  text?: boolean
  outline?: boolean
  iconContainer?: boolean
  color?: string
  textColor?: string
  focusable?: boolean
  nativeType?: 'button' | 'submit' | 'reset'
  elevation?: boolean | number | string
  ripple?: boolean
  loadingRadius?: number | string
  loadingType?: string
  loadingSize?: ButtonSize | number | string
  loadingColor?: string
}
