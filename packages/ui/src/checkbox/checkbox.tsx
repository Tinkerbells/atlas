import type { ComponentProps } from 'solid-js'

import { createEffect, createSignal, mergeProps, Show, splitProps } from 'solid-js'
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
  const checkbox = useCheckboxContext()
  const [prevState, setPrevState] = createSignal<'checked' | 'indeterminate' | 'unselected'>('unselected')
  let lastState: 'checked' | 'indeterminate' | 'unselected' = 'unselected'

  createEffect(() => {
    const current: typeof lastState = checkbox().indeterminate
      ? 'indeterminate'
      : checkbox().checked
        ? 'checked'
        : 'unselected'
    setPrevState(lastState)
    lastState = current
  })

  return (
    <ArkCheckbox.Control
      {...props}
      class={cn(
        styles.control,
        prevState() === 'checked' && styles['prev-checked'],
        prevState() === 'indeterminate' && styles['prev-indeterminate'],
        prevState() === 'unselected' && styles['prev-unselected'],
        props.class,
      )}
    />
  )
}

function Indicator(props: ComponentProps<typeof ArkCheckbox.Indicator>) {
  const checkbox = useCheckboxContext()
  const [local, rest] = splitProps(props, ['class', 'children'])
  return (
    <ArkCheckbox.Indicator
      {...rest}
      class={cn(
        styles.indicator,
        checkbox().checked && styles.checked,
        checkbox().indeterminate && styles.indeterminate,
        checkbox().checked === false && !checkbox().indeterminate && styles.unselected,
        local.class,
      )}
      indeterminate={checkbox().indeterminate}
    >
      <Show
        when={local.children}
        fallback={(
          <svg
            viewBox="0 0 18 18"
            stroke="currentColor"
            class={styles.checkIcon}
            aria-hidden="true"
          >
            <title>Checkmark</title>
            <rect class={cn(styles.mark, styles.short)} />
            <rect class={cn(styles.mark, styles.long)} />
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
