import type { ComponentProps } from 'solid-js'

import { Menu as ArkMenu } from '@ark-ui/solid/menu'

import { cn } from '../utils'
import styles from './menu.module.css'

function Trigger(props: ComponentProps<typeof ArkMenu.Trigger>) {
  return <ArkMenu.Trigger {...props} class={props.class} />
}

function ContextTrigger(props: ComponentProps<typeof ArkMenu.ContextTrigger>) {
  return <ArkMenu.ContextTrigger {...props} class={props.class} />
}

function Content(props: ComponentProps<typeof ArkMenu.Content>) {
  return <ArkMenu.Content {...props} class={cn(styles.content, props.class)} />
}

function Positioner(props: ComponentProps<typeof ArkMenu.Positioner>) {
  return <ArkMenu.Positioner {...props} class={props.class} />
}

function Item(props: ComponentProps<typeof ArkMenu.Item>) {
  return <ArkMenu.Item {...props} class={cn(styles.item, props.class)} />
}

function CheckboxItem(props: ComponentProps<typeof ArkMenu.CheckboxItem>) {
  return (
    <ArkMenu.CheckboxItem
      {...props}
      class={cn(styles.item, props.class)}
    />
  )
}

function RadioItem(props: ComponentProps<typeof ArkMenu.RadioItem>) {
  return (
    <ArkMenu.RadioItem
      {...props}
      class={cn(styles.item, props.class)}
    />
  )
}

function ItemText(props: ComponentProps<typeof ArkMenu.ItemText>) {
  return (
    <ArkMenu.ItemText
      {...props}
      class={cn(styles.itemText, props.class)}
    />
  )
}

function ItemIndicator(props: ComponentProps<typeof ArkMenu.ItemIndicator>) {
  return (
    <ArkMenu.ItemIndicator
      {...props}
      class={cn(styles.itemIndicator, props.class)}
    />
  )
}

function ItemGroup(props: ComponentProps<typeof ArkMenu.ItemGroup>) {
  return <ArkMenu.ItemGroup {...props} class={props.class} />
}

function ItemGroupLabel(props: ComponentProps<typeof ArkMenu.ItemGroupLabel>) {
  return (
    <ArkMenu.ItemGroupLabel
      {...props}
      class={cn(styles.groupLabel, props.class)}
    />
  )
}

function Separator(props: ComponentProps<typeof ArkMenu.Separator>) {
  return <ArkMenu.Separator {...props} class={cn(styles.separator, props.class)} />
}

function Arrow(props: ComponentProps<typeof ArkMenu.Arrow>) {
  return <ArkMenu.Arrow {...props} class={props.class} />
}

function ArrowTip(props: ComponentProps<typeof ArkMenu.ArrowTip>) {
  return <ArkMenu.ArrowTip {...props} class={props.class} />
}

function TriggerItem(props: ComponentProps<typeof ArkMenu.TriggerItem>) {
  return <ArkMenu.TriggerItem {...props} class={cn(styles.item, props.class)} />
}

export const Menu = {
  Root: ArkMenu.Root,
  RootProvider: ArkMenu.RootProvider,
  Context: ArkMenu.Context,
  ItemContext: ArkMenu.ItemContext,
  Trigger,
  ContextTrigger,
  Content,
  Positioner,
  Item,
  ItemText,
  ItemIndicator,
  CheckboxItem,
  RadioItem,
  RadioItemGroup: ArkMenu.RadioItemGroup,
  ItemGroup,
  ItemGroupLabel,
  Separator,
  Arrow,
  ArrowTip,
  TriggerItem,
  Indicator: ArkMenu.Indicator,
}
