import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'

import { cn } from '../utils'
import styles from './icon-button.module.css'

export type IconButtonVariant = 'solid' | 'outline' | 'ghost'
export type IconButtonSize = 'sm' | 'md' | 'lg'

export interface IconButtonProps extends ComponentProps<'button'> {
  variant?: IconButtonVariant
  size?: IconButtonSize
}

export function IconButton(props: IconButtonProps) {
  const [local, rest] = splitProps(props, ['variant', 'size', 'class', 'type'])

  return (
    <button
      {...rest}
      type={local.type ?? 'button'}
      data-variant={local.variant ?? 'ghost'}
      data-size={local.size ?? 'md'}
      class={cn(styles.iconButton, local.class)}
    />
  )
}
