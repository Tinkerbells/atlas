import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'

import { cn } from '../utils'
import styles from './input.module.css'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends ComponentProps<'input'> {
  size?: InputSize
  invalid?: boolean
}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ['size', 'class', 'invalid'])

  return (
    <input
      {...rest}
      data-size={local.size ?? 'md'}
      data-invalid={local.invalid ? 'true' : undefined}
      class={cn(styles.input, local.class)}
    />
  )
}
