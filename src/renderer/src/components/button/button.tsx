import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'

import { cn } from '../utils'
import styles from './button.module.css'

export type ButtonVariant = 'solid' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ['variant', 'size', 'class', 'type'])

  return (
    <button
      {...rest}
      type={local.type ?? 'button'}
      data-variant={local.variant ?? 'solid'}
      data-size={local.size ?? 'md'}
      class={cn(styles.button, local.class)}
    />
  )
}
