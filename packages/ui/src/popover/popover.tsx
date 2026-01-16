import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'
import { Popover as ArkPopover } from '@ark-ui/solid/popover'

import { cn } from '../utils'
import styles from './popover.module.css'

function Trigger(props: ComponentProps<typeof ArkPopover.Trigger>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkPopover.Trigger
      {...rest}
      class={cn(styles.trigger, local.class)}
    />
  )
}

function Positioner(props: ComponentProps<typeof ArkPopover.Positioner>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkPopover.Positioner
      {...rest}
      class={cn(styles.positioner, local.class)}
    />
  )
}

function Content(props: ComponentProps<typeof ArkPopover.Content>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkPopover.Content
      {...rest}
      class={cn(styles.content, local.class)}
    />
  )
}

function Title(props: ComponentProps<typeof ArkPopover.Title>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkPopover.Title
      {...rest}
      class={cn(styles.title, local.class)}
    />
  )
}

function Description(props: ComponentProps<typeof ArkPopover.Description>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkPopover.Description
      {...rest}
      class={cn(styles.description, local.class)}
    />
  )
}

function Arrow(props: ComponentProps<typeof ArkPopover.Arrow>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkPopover.Arrow
      {...rest}
      class={cn(styles.arrow, local.class)}
    />
  )
}

function ArrowTip(props: ComponentProps<typeof ArkPopover.ArrowTip>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkPopover.ArrowTip
      {...rest}
      class={cn(styles.arrowTip, local.class)}
    />
  )
}

function CloseTrigger(props: ComponentProps<typeof ArkPopover.CloseTrigger>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkPopover.CloseTrigger
      {...rest}
      class={cn(styles.closeTrigger, local.class)}
    />
  )
}

function Body(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <div {...rest} class={cn(styles.body, local.class)} />
}

function Header(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <div {...rest} class={cn(styles.header, local.class)} />
}

function Footer(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <div {...rest} class={cn(styles.footer, local.class)} />
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
  Body,
  Header,
  Footer,
}
