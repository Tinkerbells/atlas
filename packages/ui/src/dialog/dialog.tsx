import type { ComponentProps } from 'solid-js'

import { mergeProps, splitProps } from 'solid-js'
import { Dialog as ArkDialog } from '@ark-ui/solid/dialog'

import { cn } from '../utils'
import styles from './dialog.module.css'

export type DialogSize = 'sm' | 'md' | 'lg'
export type DialogVariant = 'standard' | 'fullscreen'

function Trigger(props: ComponentProps<typeof ArkDialog.Trigger>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkDialog.Trigger
      {...rest}
      class={cn(styles.trigger, local.class)}
    />
  )
}

function Backdrop(props: ComponentProps<typeof ArkDialog.Backdrop>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkDialog.Backdrop
      {...rest}
      class={cn(styles.backdrop, local.class)}
    />
  )
}

function Positioner(props: ComponentProps<typeof ArkDialog.Positioner>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkDialog.Positioner
      {...rest}
      class={cn(styles.positioner, local.class)}
    />
  )
}

interface ContentProps extends ComponentProps<typeof ArkDialog.Content> {
  size?: DialogSize
  variant?: DialogVariant
}

function Content(allProps: ContentProps) {
  const merged = mergeProps({ size: 'md' as const, variant: 'standard' as const }, allProps)
  const [local, rest] = splitProps(merged, ['class', 'size', 'variant'])
  return (
    <ArkDialog.Content
      {...rest}
      data-size={local.size}
      data-variant={local.variant}
      class={cn(styles.content, local.class)}
    />
  )
}

function Title(props: ComponentProps<typeof ArkDialog.Title>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkDialog.Title
      {...rest}
      class={cn(styles.title, local.class)}
    />
  )
}

function Description(props: ComponentProps<typeof ArkDialog.Description>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkDialog.Description
      {...rest}
      class={cn(styles.description, local.class)}
    />
  )
}

function CloseTrigger(props: ComponentProps<typeof ArkDialog.CloseTrigger>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkDialog.CloseTrigger
      {...rest}
      class={cn(styles.closeTrigger, local.class)}
    />
  )
}

function Body(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <div {...rest} class={cn(styles.body, local.class)} />
}

function Footer(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <div {...rest} class={cn(styles.footer, local.class)} />
}

export const Dialog = {
  Root: ArkDialog.Root,
  RootProvider: ArkDialog.RootProvider,
  Context: ArkDialog.Context,
  Trigger,
  Backdrop,
  Positioner,
  Content,
  Title,
  Description,
  CloseTrigger,
  Body,
  Footer,
}
