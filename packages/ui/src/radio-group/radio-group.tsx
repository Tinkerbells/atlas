import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'
import { RadioGroup as ArkRadioGroup } from '@ark-ui/solid/radio-group'

import { cn } from '../utils'
import styles from './radio-group.module.css'

export type RadioGroupSize = 'sm' | 'md' | 'lg'

interface RadioGroupRootProps extends ComponentProps<typeof ArkRadioGroup.Root> {
  size?: RadioGroupSize
}

function Root(props: RadioGroupRootProps) {
  const [local, rest] = splitProps(props, ['size', 'class'])

  return (
    <ArkRadioGroup.Root
      {...rest}
      data-size={local.size ?? 'md'}
      class={cn(styles.root, local.class)}
    />
  )
}

function Label(props: ComponentProps<typeof ArkRadioGroup.Label>) {
  return <ArkRadioGroup.Label {...props} class={cn(styles.label, props.class)} />
}

function Item(props: ComponentProps<typeof ArkRadioGroup.Item>) {
  return <ArkRadioGroup.Item {...props} class={cn(styles.item, props.class)} />
}

function ItemControl(props: ComponentProps<typeof ArkRadioGroup.ItemControl>) {
  return (
    <ArkRadioGroup.ItemControl
      {...props}
      class={cn(styles.itemControl, props.class)}
    />
  )
}

function Indicator(props: ComponentProps<typeof ArkRadioGroup.Indicator>) {
  return (
    <ArkRadioGroup.Indicator
      {...props}
      class={cn(styles.indicator, props.class)}
    />
  )
}

function ItemText(props: ComponentProps<typeof ArkRadioGroup.ItemText>) {
  return (
    <ArkRadioGroup.ItemText
      {...props}
      class={cn(styles.itemText, props.class)}
    />
  )
}

function ItemHiddenInput(props: ComponentProps<typeof ArkRadioGroup.ItemHiddenInput>) {
  return <ArkRadioGroup.ItemHiddenInput {...props} />
}

export const RadioGroup = {
  Root,
  RootProvider: ArkRadioGroup.RootProvider,
  Context: ArkRadioGroup.Context,
  Label,
  Item,
  ItemControl,
  ItemText,
  Indicator,
  ItemHiddenInput,
  ItemContext: ArkRadioGroup.ItemContext,
}
