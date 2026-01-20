import type { ComponentProps } from 'solid-js'

import { mergeProps, Show, splitProps } from 'solid-js'
import { Checkbox as ArkCheckbox, useCheckboxContext } from '@ark-ui/solid/checkbox'

import { cn } from '../utils'
import styles from './checkbox.module.css'

export type CheckboxSize = 'sm' | 'md' | 'lg'

interface CheckboxRootProps extends ComponentProps<typeof ArkCheckbox.Root> {
  size?: CheckboxSize
}

function Root(props: CheckboxRootProps) {
  const merged = mergeProps({ size: 'md' as const }, props)
  const [local, rest] = splitProps(merged, ['size', 'class', 'disabled'])

  return (
    <ArkCheckbox.Root
      {...rest}
      data-size={local.size}
      data-disabled={local.disabled ? '' : undefined}
      class={cn(styles.root, local.class)}
    />
  )
}

function Control(props: ComponentProps<typeof ArkCheckbox.Control>) {
  return (
    <ArkCheckbox.Control
      {...props}
      class={cn(styles.control, props.class)}
    />
  )
}

function Indicator(props: ComponentProps<typeof ArkCheckbox.Indicator>) {
  const checkbox = useCheckboxContext()
  const [local, rest] = splitProps(props, ['class', 'children'])
  return (
    <ArkCheckbox.Indicator
      {...rest}
      class={cn(styles.indicator, local.class)}
      indeterminate={checkbox().indeterminate}
    >
      <Show
        when={local.children}
        fallback={(
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class={styles.checkIcon}
            aria-hidden="true"
          >
            <title>Checkmark</title>
            {checkbox().indeterminate ? <path d="M6 12h12" /> : checkbox().checked ? <path d="M20 6 9 17l-5-5" /> : null}
          </svg>
        )}
      >
        {local.children}
      </Show>
    </ArkCheckbox.Indicator>
  )
}

function Label(props: ComponentProps<typeof ArkCheckbox.Label>) {
  return (
    <ArkCheckbox.Label
      {...props}
      class={cn(styles.label, props.class)}
    />
  )
}

function Group(props: ComponentProps<typeof ArkCheckbox.Group>) {
  return (
    <ArkCheckbox.Group
      {...props}
      class={cn(styles.group, props.class)}
    />
  )
}

function HiddenInput(props: ComponentProps<typeof ArkCheckbox.HiddenInput>) {
  return (
    <ArkCheckbox.HiddenInput
      {...props}
      class={cn(styles.hiddenInput, props.class)}
    />
  )
}

export const Checkbox = {
  Root,
  RootProvider: ArkCheckbox.RootProvider,
  Context: ArkCheckbox.Context,
  Group,
  GroupProvider: ArkCheckbox.GroupProvider,
  Control,
  Indicator,
  HiddenInput,
  Label,
}
