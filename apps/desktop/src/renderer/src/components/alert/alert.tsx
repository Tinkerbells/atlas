import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'

import { cn } from '../utils'
import styles from './alert.module.css'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps extends ComponentProps<'div'> {
  variant?: AlertVariant
}

function Root(props: AlertProps) {
  const [local, rest] = splitProps(props, ['variant', 'class'])

  return (
    <div
      {...rest}
      data-variant={local.variant ?? 'info'}
      class={cn(styles.alert, local.class)}
    />
  )
}

function Title(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <div {...rest} class={cn(styles.title, local.class)} />
}

function Description(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <div {...rest} class={cn(styles.description, local.class)} />
}

export const Alert = {
  Root,
  Title,
  Description,
}
