import { Show, createEffect, createSignal, onMount, splitProps } from 'solid-js'
import { createNamespace } from '../../utils/namespace'
import { cn } from '../../utils'
import { useButtonGroupContext } from '../button-group/context'
import type { ButtonProps } from './props'
import styles from './styles.module.css'
import { Loading } from '../loading'
import { useRipple } from '../ripple'

const { n, m, bem } = createNamespace('var-button', styles)

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

function formatElevation(elevation: boolean | number | string | undefined) {
  if (elevation === false) return ''
  if (elevation === true || elevation == null) return 'var-elevation--2'
  const num = Number(elevation)
  if (!Number.isNaN(num)) return `var-elevation--${num}`
  return String(elevation)
}

export const Button = (props: ButtonProps) => {
  const [local, rest] = splitProps(props, [
    'type',
    'size',
    'loading',
    'round',
    'block',
    'text',
    'outline',
    'iconContainer',
    'class',
    'children',
    'color',
    'textColor',
    'focusable',
    'style',
    'nativeType',
    'disabled',
    'elevation',
    'ripple',
    'loadingRadius',
    'loadingType',
    'loadingSize',
    'loadingColor',
  ])

  const [hovering, setHovering] = createSignal(false)
  const [focusing, setFocusing] = createSignal(false)

  const group = useButtonGroupContext()

  const type = () => local.type ?? group?.type() ?? 'default'
  const size = () => local.size ?? group?.size() ?? 'normal'
  const mode = () => {
    const gMode = group?.mode()
    if (gMode === 'text' || gMode === 'outline' || gMode === 'icon-container') return gMode
    if (local.text) return 'text'
    if (local.iconContainer) return 'icon-container'
    if (local.outline) return 'outline'
    return 'normal'
  }

  const isText = () => mode() === 'text'
  const isOutline = () => mode() === 'outline'
  const isIconContainer = () => mode() === 'icon-container'

  const color = () => local.color ?? group?.color()
  const textColor = () => local.textColor ?? group?.textColor()

  const elevation = () => (isText() || isIconContainer() ? '' : formatElevation(group ? group.elevation() : local.elevation))

  const typeClass = () => {
    const key = type()
    if (isText()) return n(`--text-${key}`)
    if (isIconContainer()) return n(`--icon-container-${key}`)
    return n(`--${key}`)
  }

  const inlineStyle = () => {
    const base = typeof local.style === 'object' ? local.style : undefined
    return {
      color: isText() ? textColor() : undefined,
      background: !isText() && !isIconContainer() && color() ? color() : undefined,
      ...base,
    }
  }

  const handleMouseEnter = () => setHovering(true)
  const handleMouseLeave = () => setHovering(false)
  const handleFocus = () => {
    if (local.focusable === false) return
    setFocusing(true)
  }
  const handleBlur = () => setFocusing(false)

  let buttonRef: HTMLButtonElement | undefined

  onMount(() => {
    useRipple(() => buttonRef, () => ({
      color: undefined,
      disabled: local.disabled || local.loading || local.ripple === false,
    }))
  })

  return (
    <button
      ref={buttonRef}
      type={local.nativeType ?? 'button'}
      {...rest}
      class={bem(
        n(),
        m(size()),
        typeClass(),
        isText() && n('--text'),
        isIconContainer() && n('--icon-container'),
        local.block && n('--block'),
        local.round && n('--round'),
        (isOutline() || local.outline) && n('--outline'),
        local.loading && n('--loading'),
        local.disabled && n('--disabled'),
        isText() && local.disabled && n('--text-disabled'),
        elevation(),
        local.class,
      )}
      tabindex={local.focusable === false ? '-1' : rest.tabindex}
      disabled={local.disabled || local.loading}
      style={inlineStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div class={cn(n('__content'), local.loading && n('--hidden'))}>{local.children}</div>
      <Show when={local.loading}>
        <Loading
          class={n('__loading')}
          cover
          color={local.loadingColor ?? 'currentColor'}
          size={local.loadingSize ?? size()}
          radius={local.loadingRadius}
        />
      </Show>
      <div
        class={cn(
          'var-hover-overlay',
          !local.disabled && !local.loading && hovering() && 'var-hover-overlay--hover',
          !local.disabled && !local.loading && focusing() && 'var-hover-overlay--focus',
        )}
      />
    </button>
  )
}

export type { ButtonProps } from './props'
export default Button
