import type { ComponentProps } from 'solid-js'

import { mergeProps, splitProps } from 'solid-js'

import { cn } from '../utils'
import styles from './badge.module.css'

export type BadgeVariant = 'surface' | 'primary' | 'secondary' | 'tertiary' | 'error'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps extends ComponentProps<'span'> {
  variant?: BadgeVariant
  size?: BadgeSize
  /** Render as a small dot indicator; text stays visually hidden. */
  dot?: boolean
}

export function Badge(allProps: BadgeProps) {
  const merged = mergeProps({ variant: 'surface', size: 'md' }, allProps)
  const [local, rest] = splitProps(merged, ['variant', 'size', 'dot', 'class', 'children'])

  return (
    <span
      {...rest}
      data-variant={local.variant}
      data-size={local.size}
      data-dot={local.dot ? '' : undefined}
      class={cn(styles.badge, local.class)}
      aria-label={local.dot ? rest['aria-label'] ?? 'Notification' : rest['aria-label']}
    >
      <span class={styles.content} aria-hidden={local.dot ? 'true' : undefined}>
        {local.children}
      </span>
    </span>
  )
}
