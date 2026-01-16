import type { ComponentProps } from 'solid-js'

import { createMemo, mergeProps, splitProps } from 'solid-js'

import { cn } from '../utils'
import styles from './icon-button.module.css'

export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined'
export type IconButtonSize = 'sm' | 'md' | 'lg'

export interface IconButtonProps extends ComponentProps<'button'> {
  variant?: IconButtonVariant
  size?: IconButtonSize
  /** Marks button as selected; sets `aria-pressed` by default. */
  selected?: boolean
}

export function IconButton(allProps: IconButtonProps) {
  const props = mergeProps({ variant: 'standard', size: 'md', type: 'button' as const }, allProps)
  const [local, rest] = splitProps(props, [
    'variant',
    'size',
    'class',
    'children',
    'selected',
    'type',
    'aria-pressed',
  ])

  const pressed = createMemo<IconButtonProps['aria-pressed']>(() => {
    if (local['aria-pressed'] !== undefined) {
      return local['aria-pressed']
    }
    if (local.selected !== undefined) {
      return local.selected
    }
    return undefined
  })

  return (
    <button
      {...rest}
      type={local.type}
      data-variant={local.variant}
      data-size={local.size}
      data-selected={local.selected ? '' : undefined}
      aria-pressed={pressed()}
      class={cn(styles.iconButton, local.class)}
    >
      {local.children}
    </button>
  )
}
