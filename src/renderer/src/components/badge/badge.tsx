import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'

import { cn } from '../utils'
import styles from './badge.module.css'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps extends ComponentProps<'span'> {
  variant?: BadgeVariant
  size?: BadgeSize
}

export function Badge(props: BadgeProps) {
  const [local, rest] = splitProps(props, ['variant', 'size', 'class'])

  return (
    <span
      {...rest}
      data-variant={local.variant ?? 'default'}
      data-size={local.size ?? 'md'}
      class={cn(styles.badge, local.class)}
    />
  )
}
