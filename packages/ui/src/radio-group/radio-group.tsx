import type { ComponentProps } from 'solid-js'

import { createMemo, mergeProps, splitProps } from 'solid-js'
import { RadioGroup as ArkRadioGroup } from '@ark-ui/solid/radio-group'

import { cn } from '../utils'
import styles from './radio-group.module.css'

export type RadioGroupSize = 'sm' | 'md' | 'lg'

interface RadioGroupRootProps extends ComponentProps<typeof ArkRadioGroup.Root> {
  size?: RadioGroupSize
}

function Root(allProps: RadioGroupRootProps) {
  const mergedProps = mergeProps({ size: 'md' as const }, allProps)
  const [local, rest] = splitProps(mergedProps, ['size', 'class'])
  const size = createMemo(() => local.size ?? 'md')

  return (
    <ArkRadioGroup.Root
      {...rest}
      data-size={size()}
      class={cn(styles.root, local.class)}
    />
  )
}

function Label(props: ComponentProps<typeof ArkRadioGroup.Label>) {
  return <ArkRadioGroup.Label {...props} class={cn(styles.label, props.class)} />
}

function Item(allProps: ComponentProps<typeof ArkRadioGroup.Item>) {
  const [local, rest] = splitProps(allProps, ['class', 'disabled'])

  return (
    <ArkRadioGroup.Item
      {...rest}
      disabled={local.disabled}
      class={cn(styles.item, local.class)}
    />
  )
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
  return (
    <ArkRadioGroup.ItemHiddenInput
      {...props}
      class={cn(styles.itemHiddenInput, props.class)}
    />
  )
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
