import type { ComponentProps } from 'solid-js'

import { Popover as ArkPopover } from '@ark-ui/solid/popover'

import { cn } from '../utils'
import styles from './popover.module.css'

function Trigger(props: ComponentProps<typeof ArkPopover.Trigger>) {
  return <ArkPopover.Trigger {...props} class={props.class} />
}

function Positioner(props: ComponentProps<typeof ArkPopover.Positioner>) {
  return <ArkPopover.Positioner {...props} class={props.class} />
}

function Content(props: ComponentProps<typeof ArkPopover.Content>) {
  return <ArkPopover.Content {...props} class={cn(styles.content, props.class)} />
}

function Title(props: ComponentProps<typeof ArkPopover.Title>) {
  return <ArkPopover.Title {...props} class={cn(styles.title, props.class)} />
}

function Description(props: ComponentProps<typeof ArkPopover.Description>) {
  return (
    <ArkPopover.Description
      {...props}
      class={cn(styles.description, props.class)}
    />
  )
}

function Arrow(props: ComponentProps<typeof ArkPopover.Arrow>) {
  return <ArkPopover.Arrow {...props} class={cn(styles.arrow, props.class)} />
}

function ArrowTip(props: ComponentProps<typeof ArkPopover.ArrowTip>) {
  return <ArkPopover.ArrowTip {...props} class={props.class} />
}

function CloseTrigger(props: ComponentProps<typeof ArkPopover.CloseTrigger>) {
  return <ArkPopover.CloseTrigger {...props} class={props.class} />
}

export const Popover = {
  Root: ArkPopover.Root,
  RootProvider: ArkPopover.RootProvider,
  Context: ArkPopover.Context,
  Trigger,
  Positioner,
  Content,
  Title,
  Description,
  Arrow,
  ArrowTip,
  CloseTrigger,
  Anchor: ArkPopover.Anchor,
}
