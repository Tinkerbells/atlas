import type { ComponentProps } from 'solid-js'

import { Tooltip as ArkTooltip } from '@ark-ui/solid/tooltip'

import { cn } from '../utils'
import styles from './tooltip.module.css'

function Trigger(props: ComponentProps<typeof ArkTooltip.Trigger>) {
  return <ArkTooltip.Trigger {...props} class={props.class} />
}

function Positioner(props: ComponentProps<typeof ArkTooltip.Positioner>) {
  return <ArkTooltip.Positioner {...props} class={props.class} />
}

function Content(props: ComponentProps<typeof ArkTooltip.Content>) {
  return <ArkTooltip.Content {...props} class={cn(styles.content, props.class)} />
}

function Arrow(props: ComponentProps<typeof ArkTooltip.Arrow>) {
  return <ArkTooltip.Arrow {...props} class={cn(styles.arrow, props.class)} />
}

function ArrowTip(props: ComponentProps<typeof ArkTooltip.ArrowTip>) {
  return <ArkTooltip.ArrowTip {...props} class={props.class} />
}

export const Tooltip = {
  Root: ArkTooltip.Root,
  RootProvider: ArkTooltip.RootProvider,
  Context: ArkTooltip.Context,
  Trigger,
  Positioner,
  Content,
  Arrow,
  ArrowTip,
}
