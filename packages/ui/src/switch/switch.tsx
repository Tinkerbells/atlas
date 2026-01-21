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
  return <ArkSwitch.Control {...props} class={cn(styles.control, props.class)} />
}

function Thumb(props: ComponentProps<typeof ArkSwitch.Thumb>) {
  return <ArkSwitch.Thumb {...props} class={cn(styles.thumb, props.class)} />
}

function Label(props: ComponentProps<typeof ArkSwitch.Label>) {
  return <ArkSwitch.Label {...props} class={cn(styles.label, props.class)} />
}

function HiddenInput(props: ComponentProps<typeof ArkSwitch.HiddenInput>) {
  return <ArkSwitch.HiddenInput {...props} class={styles.input} />
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
