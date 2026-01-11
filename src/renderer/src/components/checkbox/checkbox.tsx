import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'
import { Checkbox as ArkCheckbox } from '@ark-ui/solid/checkbox'

import { cn } from '../utils'
import styles from './checkbox.module.css'

export type CheckboxSize = 'sm' | 'md' | 'lg'

interface CheckboxRootProps extends ComponentProps<typeof ArkCheckbox.Root> {
  size?: CheckboxSize
}

function Root(props: CheckboxRootProps) {
  const [local, rest] = splitProps(props, ['size', 'class'])

  return (
    <ArkCheckbox.Root
      {...rest}
      data-size={local.size ?? 'md'}
      class={cn(styles.root, local.class)}
    />
  )
}

function Control(props: ComponentProps<typeof ArkCheckbox.Control>) {
  return (
    <ArkCheckbox.Control
      {...props}
      class={cn(styles.control, props.class)}
    />
  )
}

function Indicator(props: ComponentProps<typeof ArkCheckbox.Indicator>) {
  return (
    <ArkCheckbox.Indicator
      {...props}
      class={cn(styles.indicator, props.class)}
    />
  )
}

function Label(props: ComponentProps<typeof ArkCheckbox.Label>) {
  return <ArkCheckbox.Label {...props} class={cn(styles.label, props.class)} />
}

function Group(props: ComponentProps<typeof ArkCheckbox.Group>) {
  return <ArkCheckbox.Group {...props} class={cn(styles.group, props.class)} />
}

function HiddenInput(props: ComponentProps<typeof ArkCheckbox.HiddenInput>) {
  return <ArkCheckbox.HiddenInput {...props} />
}

export const Checkbox = {
  Root,
  RootProvider: ArkCheckbox.RootProvider,
  Context: ArkCheckbox.Context,
  Group,
  GroupProvider: ArkCheckbox.GroupProvider,
  Control,
  Indicator,
  HiddenInput,
  Label,
}
