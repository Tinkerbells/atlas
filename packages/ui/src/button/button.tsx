import './button.styles.scss'
import type { ComponentProps, JSX } from 'solid-js'

import { mergeProps, Show, splitProps } from 'solid-js'

import { block } from '@/utils/bem'

const b = block('button')

interface ButtonLoadingProps {
  /**
   * The visual style of the button.
   * @default "default"
   */
  variant?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'danger'
  /**
   * The size of the button.
   * @default "normal"
   */
  size?: 'normal' | 'mini' | 'small' | 'large'
  /**
   * If `true`, the button will have a ripple effect on click.
   * @default true
   */
  ripple?: boolean
  /**
   * The elevation level of the button.
   * @default false
   */
  elevation?: boolean | number | string
  /**
   * If `true`, the button will show a loading spinner.
   * @default false
   */
  loading?: boolean | undefined
  /**
   * The text to show while loading.
   */
  loadingText?: JSX.Element | undefined
  /**
   * The spinner to show while loading.
   */
  spinner?: JSX.Element | undefined
  /**
   * The placement of the spinner
   * @default "start"
   */
  spinnerPlacement?: 'start' | 'end' | undefined
}

type BaseButtonProps = ComponentProps<'button'>

export interface ButtonProps extends BaseButtonProps, ButtonLoadingProps { }

export function Button(props: ButtonProps) {
  const merged = mergeProps(
    {
      variant: 'default',
      size: 'normal',
      ripple: true,
    },
    props,
  )

  const [local, rest] = splitProps(merged, [
    'variant',
    'size',
    'ripple',
    'elevation',
    'loading',
    'loadingText',
    'children',
    'spinner',
    'spinnerPlacement',
    'class',
  ])

  return (
    <button
      type="button"
      disabled={local.loading || rest.disabled}
      class={b(
        {
          [local.size]: true,
          [local.variant]: true,
          disabled: rest.disabled,
        },
        local.class,
      )}
      {...rest}
    >
      <Show when={local.loading} fallback={local.children}>
        <div>Loading...</div>
      </Show>
    </button>
  )
}
