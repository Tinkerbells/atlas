import type { ComponentProps } from 'solid-js'
import type {
  CollectionItem,
  SelectRootComponent,
  SelectRootProviderComponent,
} from '@ark-ui/solid/select'

import { splitProps } from 'solid-js'
import { Select as ArkSelect, createListCollection } from '@ark-ui/solid/select'

import { cn } from '../utils'
import styles from './select.module.css'

export type SelectSize = 'sm' | 'md' | 'lg'

const Root: SelectRootComponent<{ size?: SelectSize }> = (props) => {
  const [local, rest] = splitProps(props, ['size', 'class'])

  return (
    <ArkSelect.Root
      {...rest}
      data-size={local.size ?? 'md'}
      class={cn(styles.root, local.class)}
    />
  )
}

const RootProvider: SelectRootProviderComponent<{ size?: SelectSize }> = (props) => {
  const [local, rest] = splitProps(props, ['size', 'class'])

  return (
    <ArkSelect.RootProvider
      {...rest}
      data-size={local.size ?? 'md'}
      class={cn(styles.root, local.class)}
    />
  )
}

function Label(props: ComponentProps<typeof ArkSelect.Label>) {
  return <ArkSelect.Label {...props} class={cn(styles.label, props.class)} />
}

function Control(props: ComponentProps<typeof ArkSelect.Control>) {
  return <ArkSelect.Control {...props} class={cn(styles.control, props.class)} />
}

function Trigger(props: ComponentProps<typeof ArkSelect.Trigger>) {
  return <ArkSelect.Trigger {...props} class={cn(styles.trigger, props.class)} />
}

function ValueText(props: ComponentProps<typeof ArkSelect.ValueText>) {
  return <ArkSelect.ValueText {...props} class={cn(styles.valueText, props.class)} />
}

function Indicator(props: ComponentProps<typeof ArkSelect.Indicator>) {
  return <ArkSelect.Indicator {...props} class={cn(styles.indicator, props.class)} />
}

function Content(props: ComponentProps<typeof ArkSelect.Content>) {
  return <ArkSelect.Content {...props} class={cn(styles.content, props.class)} />
}

function List(props: ComponentProps<typeof ArkSelect.List>) {
  return <ArkSelect.List {...props} class={cn(styles.list, props.class)} />
}

function Item(props: ComponentProps<typeof ArkSelect.Item>) {
  return <ArkSelect.Item {...props} class={cn(styles.item, props.class)} />
}

function ItemText(props: ComponentProps<typeof ArkSelect.ItemText>) {
  return <ArkSelect.ItemText {...props} class={cn(styles.itemText, props.class)} />
}

function ItemIndicator(props: ComponentProps<typeof ArkSelect.ItemIndicator>) {
  return (
    <ArkSelect.ItemIndicator
      {...props}
      class={cn(styles.itemIndicator, props.class)}
    />
  )
}

function Positioner(props: ComponentProps<typeof ArkSelect.Positioner>) {
  return <ArkSelect.Positioner {...props} class={props.class} />
}

function ItemGroup(props: ComponentProps<typeof ArkSelect.ItemGroup>) {
  return <ArkSelect.ItemGroup {...props} class={props.class} />
}

function ItemGroupLabel(props: ComponentProps<typeof ArkSelect.ItemGroupLabel>) {
  return <ArkSelect.ItemGroupLabel {...props} class={props.class} />
}

function HiddenSelect(props: ComponentProps<typeof ArkSelect.HiddenSelect>) {
  return <ArkSelect.HiddenSelect {...props} />
}

function ClearTrigger(props: ComponentProps<typeof ArkSelect.ClearTrigger>) {
  return <ArkSelect.ClearTrigger {...props} class={props.class} />
}

export const Select = {
  Root,
  RootProvider,
  Context: ArkSelect.Context,
  ItemContext: ArkSelect.ItemContext,
  Control,
  Trigger,
  ValueText,
  Indicator,
  Content,
  List,
  Item,
  ItemText,
  ItemIndicator,
  Positioner,
  Label,
  ItemGroup,
  ItemGroupLabel,
  HiddenSelect,
  ClearTrigger,
}

export { createListCollection }
export type { CollectionItem }
