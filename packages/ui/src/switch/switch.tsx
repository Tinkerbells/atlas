import type { ComponentProps } from 'solid-js'

import { mergeProps, splitProps } from 'solid-js'
import { Switch as ArkSwitch } from '@ark-ui/solid/switch'

import { cn } from '../utils'
import styles from './switch.module.css'

export type SwitchSize = 'sm' | 'md' | 'lg'

interface SwitchRootProps extends ComponentProps<typeof ArkSwitch.Root> {
  size?: SwitchSize
}

function Root(props: SwitchRootProps) {
  const merged = mergeProps({ size: 'md' as const }, props)
  const [local, rest] = splitProps(merged, ['size', 'class', 'disabled'])

  return (
    <ArkSwitch.Root
      {...rest}
      data-size={local.size}
      data-disabled={local.disabled ? '' : undefined}
      class={cn(styles.root, local.class)}
    />
  )
}

function Control(props: ComponentProps<typeof ArkSwitch.Control>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkSwitch.Control
      {...rest}
      class={cn(styles.control, local.class)}
    />
  )
}

function Thumb(props: ComponentProps<typeof ArkSwitch.Thumb>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkSwitch.Thumb
      {...rest}
      class={cn(styles.thumb, local.class)}
    />
  )
}

function Label(props: ComponentProps<typeof ArkSwitch.Label>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkSwitch.Label
      {...rest}
      class={cn(styles.label, local.class)}
    />
  )
}

function HiddenInput(props: ComponentProps<typeof ArkSwitch.HiddenInput>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkSwitch.HiddenInput
      {...rest}
      class={cn(styles.input, local.class)}
    />
  )
}

export const Switch = {
  Root,
  RootProvider: ArkSwitch.RootProvider,
  Context: ArkSwitch.Context,
  Control,
  Thumb,
  HiddenInput,
  Label,
}
