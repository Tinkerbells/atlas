import type { ComponentProps } from 'solid-js'

import { Dialog as ArkDialog } from '@ark-ui/solid/dialog'

import styles from './dialog.module.css'

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ')
}

function Trigger(props: ComponentProps<typeof ArkDialog.Trigger>) {
  return <ArkDialog.Trigger {...props} class={cx(styles.trigger, props.class)} />
}

function Backdrop(props: ComponentProps<typeof ArkDialog.Backdrop>) {
  return <ArkDialog.Backdrop {...props} class={cx(styles.backdrop, props.class)} />
}

function Positioner(props: ComponentProps<typeof ArkDialog.Positioner>) {
  return (
    <ArkDialog.Positioner
      {...props}
      class={cx(styles.positioner, props.class)}
    />
  )
}

function Content(props: ComponentProps<typeof ArkDialog.Content>) {
  return <ArkDialog.Content {...props} class={cx(styles.content, props.class)} />
}

function Title(props: ComponentProps<typeof ArkDialog.Title>) {
  return <ArkDialog.Title {...props} class={cx(styles.title, props.class)} />
}

function Description(props: ComponentProps<typeof ArkDialog.Description>) {
  return (
    <ArkDialog.Description
      {...props}
      class={cx(styles.description, props.class)}
    />
  )
}

function CloseTrigger(props: ComponentProps<typeof ArkDialog.CloseTrigger>) {
  return (
    <ArkDialog.CloseTrigger
      {...props}
      class={cx(styles.closeTrigger, props.class)}
    />
  )
}

export const Dialog = {
  Root: ArkDialog.Root,
  Trigger,
  Backdrop,
  Positioner,
  Content,
  Title,
  Description,
  CloseTrigger,
}
