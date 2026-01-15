import type { ComponentProps } from 'solid-js'

import { ScrollArea as ArkScrollArea } from '@ark-ui/solid/scroll-area'

import { cn } from '../utils'
import styles from './scroll-area.module.css'

function Root(props: ComponentProps<typeof ArkScrollArea.Root>) {
  return <ArkScrollArea.Root {...props} class={cn(styles.root, props.class)} />
}

function Viewport(props: ComponentProps<typeof ArkScrollArea.Viewport>) {
  return (
    <ArkScrollArea.Viewport
      {...props}
      class={cn(styles.viewport, props.class)}
    />
  )
}

function Content(props: ComponentProps<typeof ArkScrollArea.Content>) {
  return (
    <ArkScrollArea.Content
      {...props}
      class={cn(styles.content, props.class)}
    />
  )
}

function Scrollbar(props: ComponentProps<typeof ArkScrollArea.Scrollbar>) {
  return (
    <ArkScrollArea.Scrollbar
      {...props}
      class={cn(styles.scrollbar, props.class)}
    />
  )
}

function Thumb(props: ComponentProps<typeof ArkScrollArea.Thumb>) {
  return <ArkScrollArea.Thumb {...props} class={cn(styles.thumb, props.class)} />
}

function Corner(props: ComponentProps<typeof ArkScrollArea.Corner>) {
  return (
    <ArkScrollArea.Corner
      {...props}
      class={cn(styles.corner, props.class)}
    />
  )
}

export const ScrollArea = {
  Root,
  RootProvider: ArkScrollArea.RootProvider,
  Context: ArkScrollArea.Context,
  Viewport,
  Content,
  Scrollbar,
  Thumb,
  Corner,
}
