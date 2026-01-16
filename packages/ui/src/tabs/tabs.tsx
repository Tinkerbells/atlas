import type { ComponentProps } from 'solid-js'

import { Tabs as ArkTabs } from '@ark-ui/solid/tabs'
import { createMemo, mergeProps, splitProps } from 'solid-js'

import { cn } from '../utils'
import styles from './tabs.module.css'

export type TabsSize = 'sm' | 'md' | 'lg'
export type TabsVariant = 'primary' | 'secondary'
export type TabsPlacement = 'top' | 'bottom' | 'left' | 'right'
export type TabsAlign = 'start' | 'center' | 'end'

interface TabsRootProps extends ComponentProps<typeof ArkTabs.Root> {
  size?: TabsSize
  variant?: TabsVariant
  placement?: TabsPlacement
  align?: TabsAlign
}

function Root(allProps: TabsRootProps) {
  const props = mergeProps(
    { size: 'md', variant: 'primary', placement: 'top' as const, align: 'start' as const },
    allProps,
  )
  const [local, rest] = splitProps(props, [
    'size',
    'variant',
    'placement',
    'align',
    'class',
    'orientation',
  ])

  const orientation = createMemo(() => {
    const isVertical = local.placement === 'left' || local.placement === 'right'
    const derivedOrientation = isVertical ? 'vertical' : 'horizontal'
    return local.orientation ?? derivedOrientation
  })

  return (
    <ArkTabs.Root
      {...rest}
      orientation={orientation()}
      data-size={local.size}
      data-variant={local.variant}
      data-placement={local.placement}
      data-align={local.align}
      class={cn(styles.root, local.class)}
    />
  )
}

interface TabsRootProviderProps extends ComponentProps<typeof ArkTabs.RootProvider> {
  size?: TabsSize
  variant?: TabsVariant
  placement?: TabsPlacement
  align?: TabsAlign
}

function RootProvider(allProps: TabsRootProviderProps) {
  const props = mergeProps(
    { size: 'md', variant: 'primary', placement: 'top' as const, align: 'start' as const },
    allProps,
  )
  const [local, rest] = splitProps(props, ['size', 'variant', 'placement', 'align', 'class'])

  return (
    <ArkTabs.RootProvider
      {...rest}
      data-size={local.size}
      data-variant={local.variant}
      data-placement={local.placement}
      data-align={local.align}
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
  return <ArkTabs.Indicator {...props} class={cn(styles.indicator, props.class)} />
}

export const Tabs = {
  Root,
  RootProvider,
  Context: ArkTabs.Context,
  List,
  Trigger,
  Content,
  Indicator,
}
