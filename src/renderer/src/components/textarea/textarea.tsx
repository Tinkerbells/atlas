import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'

import { cn } from '../utils'
import styles from './textarea.module.css'

export type TextareaSize = 'sm' | 'md' | 'lg'

export interface TextareaProps extends ComponentProps<'textarea'> {
  size?: TextareaSize
  invalid?: boolean
}

export function Textarea(props: TextareaProps) {
  const [local, rest] = splitProps(props, ['size', 'class', 'invalid'])

  return (
    <textarea
      {...rest}
      data-size={local.size ?? 'md'}
      data-invalid={local.invalid ? 'true' : undefined}
      class={cn(styles.textarea, local.class)}
    />
  )
}
