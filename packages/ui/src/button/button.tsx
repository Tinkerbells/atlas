import type { ComponentProps, JSX } from 'solid-js'

import { createContext, createMemo, mergeProps, Show, splitProps, useContext } from 'solid-js'

import { cn } from '../utils'
import { Loader } from '../loader'
import styles from './button.module.css'

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonLoadingProps {
  /** Show a loader and block interactions. */
  loading?: boolean
  /** Text displayed while loading; falls back to regular children. */
  loadingText?: JSX.Element
  /** Custom spinner element. */
  spinner?: JSX.Element
  /** Controls where the spinner is rendered. */
  spinnerPlacement?: 'start' | 'end'
}

interface ButtonContentProps {
  /** Optional leading icon. */
  leadingIcon?: JSX.Element
  /** Optional trailing icon. */
  trailingIcon?: JSX.Element
  /** Expand button to the container width. */
  fullWidth?: boolean
}

type ButtonVariantProps = Pick<ButtonProps, 'variant' | 'size' | 'fullWidth'>

const ButtonVariantContext = createContext<() => ButtonVariantProps | undefined>()

const useButtonVariantProps = () => useContext(ButtonVariantContext)

export interface ButtonProps
  extends ComponentProps<'button'>,
  ButtonLoadingProps,
  ButtonContentProps {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button(allProps: ButtonProps) {
  const contextProps = useButtonVariantProps()
  const mergedProps = mergeProps(
    { variant: 'filled', size: 'md', type: 'button' as const },
    contextProps?.() ?? {},
    allProps,
  )

  const [local, rest] = splitProps(mergedProps, [
    'variant',
    'size',
    'class',
    'children',
    'leadingIcon',
    'trailingIcon',
    'loading',
    'loadingText',
    'spinner',
    'spinnerPlacement',
    'fullWidth',
    'disabled',
    'type',
  ])

  const isLoading = createMemo(() => Boolean(local.loading))
  const placement = createMemo(() => local.spinnerPlacement ?? 'start')

  return (
    <button
      {...rest}
      type={local.type}
      data-variant={local.variant}
      data-size={local.size}
      data-full-width={local.fullWidth ? '' : undefined}
      data-loading={isLoading() ? '' : undefined}
      class={cn(styles.button, local.fullWidth && styles.fullWidth, local.class)}
      disabled={local.disabled || isLoading()}
      aria-busy={isLoading() ? 'true' : undefined}
    >
      <Show when={isLoading()} fallback={<ButtonContent {...local} />}>
        <Loader
          spinner={local.spinner ?? <SpinnerIcon />}
          text={local.loadingText ?? local.children}
          spinnerPlacement={placement()}
          class={cn(styles.content, styles.loadingContent)}
        />
      </Show>
    </button>
  )
}

function ButtonContent(props: Pick<ButtonProps, 'leadingIcon' | 'trailingIcon' | 'children'>) {
  return (
    <span class={styles.content}>
      <Show when={props.leadingIcon}>
        <span class={styles.icon} aria-hidden="true">
          {props.leadingIcon}
        </span>
      </Show>
      <span class={styles.label}>{props.children}</span>
      <Show when={props.trailingIcon}>
        <span class={styles.icon} aria-hidden="true">
          {props.trailingIcon}
        </span>
      </Show>
    </span>
  )
}

function SpinnerIcon() {
  return (
    <span
      class={styles.spinner}
      aria-hidden="true"
    />
  )
}

export interface ButtonGroupProps extends ComponentProps<'div'>, ButtonVariantProps {
  orientation?: 'horizontal' | 'vertical'
}

export function ButtonGroup(props: ButtonGroupProps) {
  const [local, rest] = splitProps(props, [
    'variant',
    'size',
    'fullWidth',
    'orientation',
    'class',
    'children',
  ])
  const contextValue = createMemo(() => ({
    variant: local.variant,
    size: local.size,
    fullWidth: local.fullWidth,
  }))

  return (
    <ButtonVariantContext.Provider value={contextValue}>
      <div
        {...rest}
        data-orientation={local.orientation ?? 'horizontal'}
        class={cn(styles.group, local.class)}
      >
        {local.children}
      </div>
    </ButtonVariantContext.Provider>
  )
}
