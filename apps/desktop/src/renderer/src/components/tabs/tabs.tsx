import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'
import { Tabs as ArkTabs } from '@ark-ui/solid/tabs'

import { cn } from '../utils'
import styles from './tabs.module.css'

export type TabsSize = 'sm' | 'md' | 'lg'

interface TabsRootProps extends ComponentProps<typeof ArkTabs.Root> {
  size?: TabsSize
}

function Root(props: TabsRootProps) {
  const [local, rest] = splitProps(props, ['size', 'class'])

  return (
    <ArkTabs.Root
      {...rest}
      data-size={local.size ?? 'md'}
      class={cn(styles.root, local.class)}
    />
  )
}

function List(props: ComponentProps<typeof ArkTabs.List>) {
  return <ArkTabs.List {...props} class={cn(styles.list, props.class)} />
}

function Trigger(props: ComponentProps<typeof ArkTabs.Trigger>) {
  return <ArkTabs.Trigger {...props} class={cn(styles.trigger, props.class)} />
}

function Content(props: ComponentProps<typeof ArkTabs.Content>) {
  return <ArkTabs.Content {...props} class={cn(styles.content, props.class)} />
}

function Indicator(props: ComponentProps<typeof ArkTabs.Indicator>) {
  return <ArkTabs.Indicator {...props} class={props.class} />
}

export const Tabs = {
  Root,
  RootProvider: ArkTabs.RootProvider,
  Context: ArkTabs.Context,
  List,
  Trigger,
  Content,
  Indicator,
}
