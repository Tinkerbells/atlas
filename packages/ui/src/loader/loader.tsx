import type { ComponentProps, JSX } from 'solid-js'

import { mergeProps, Show, splitProps } from 'solid-js'

import { cn } from '../utils'
import styles from './loader.module.css'

export interface LoaderProps extends ComponentProps<'span'> {
  /** Whether the loader should render. Defaults to true. */
  visible?: boolean
  /** Custom spinner element. */
  spinner?: JSX.Element
  /** Text displayed while loading. Falls back to children. */
  text?: JSX.Element
  /** Spinner placement relative to the text. */
  spinnerPlacement?: 'start' | 'end'
}

export function Loader(props: LoaderProps) {
  const merged = mergeProps({ visible: true }, props)
  const [local, rest] = splitProps(merged, [
    'visible',
    'spinner',
    'text',
    'spinnerPlacement',
    'children',
    'class',
  ])

  const spinnerPlacement = () => local.spinnerPlacement ?? 'start'
  const hasText = () => local.text !== undefined
  const hasCustomSpinner = () => local.spinner !== undefined
  const spinner = () =>
    local.spinner ?? (
      <span
        class={styles.spinner}
        aria-hidden="true"
      />
    )

  return (
    <Show when={local.visible} fallback={local.children as JSX.Element}>
      <Show
        when={hasText()}
        fallback={(
          <Show
            when={hasCustomSpinner()}
            fallback={(
              <span
                {...rest}
                class={cn(styles.loader, local.class)}
              >
                {local.children}
              </span>
            )}
          >
            <span
              {...rest}
              class={cn(styles.loader, styles.overlay, local.class)}
              aria-busy="true"
            >
              <span class={styles.center}>{spinner()}</span>
              <span class={styles.hidden}>{local.children}</span>
            </span>
          </Show>
        )}
      >
        <span
          {...rest}
          data-spinner-placement={spinnerPlacement()}
          class={cn(styles.loader, styles.withText, local.class)}
          aria-busy="true"
        >
          {spinnerPlacement() === 'start' && <span class={styles.spinnerSlot}>{spinner()}</span>}
          <span class={styles.text}>{local.text}</span>
          {spinnerPlacement() === 'end' && <span class={styles.spinnerSlot}>{spinner()}</span>}
        </span>
      </Show>
    </Show>
  )
}
