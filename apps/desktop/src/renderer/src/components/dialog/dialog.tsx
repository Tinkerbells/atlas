import type { ComponentProps } from 'solid-js'

import { Dialog as ArkDialog } from '@ark-ui/solid/dialog'

import { cn } from '../utils'
import styles from './dialog.module.css'

function Trigger(props: ComponentProps<typeof ArkDialog.Trigger>) {
  return <ArkDialog.Trigger {...props} class={cn(styles.trigger, props.class)} />
}

function Backdrop(props: ComponentProps<typeof ArkDialog.Backdrop>) {
  return <ArkDialog.Backdrop {...props} class={cn(styles.backdrop, props.class)} />
}

function Positioner(props: ComponentProps<typeof ArkDialog.Positioner>) {
  return (
    <ArkDialog.Positioner
      {...props}
      class={cn(styles.positioner, props.class)}
    />
  )
}

function Content(props: ComponentProps<typeof ArkDialog.Content>) {
  return <ArkDialog.Content {...props} class={cn(styles.content, props.class)} />
}

function Title(props: ComponentProps<typeof ArkDialog.Title>) {
  return <ArkDialog.Title {...props} class={cn(styles.title, props.class)} />
}

function Description(props: ComponentProps<typeof ArkDialog.Description>) {
  return (
    <ArkDialog.Description
      {...props}
      class={cn(styles.description, props.class)}
    />
  )
}

function CloseTrigger(props: ComponentProps<typeof ArkDialog.CloseTrigger>) {
  return (
    <ArkDialog.CloseTrigger
      {...props}
      class={cn(styles.closeTrigger, props.class)}
    />
  )
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
}
