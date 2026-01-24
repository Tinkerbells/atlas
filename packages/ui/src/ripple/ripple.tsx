/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import './ripple.styles.scss'
import type { ComponentProps } from 'solid-js'

import { batch, createEffect, createSignal, onCleanup, onMount, splitProps, untrack } from 'solid-js'

import { block } from '@/utils'

const b = block('ripple')
const PRESS_GROW_MS = 450
const MINIMUM_PRESS_MS = 225
const INITIAL_ORIGIN_SCALE = 0.2
const PADDING = 10
const SOFT_EDGE_MINIMUM_SIZE = 75
const SOFT_EDGE_CONTAINER_RATIO = 0.35
const PRESS_PSEUDO = '::after'
const ANIMATION_FILL = 'forwards'
const TOUCH_DELAY_MS = 150
const State = {
  INACTIVE: 0,
  TOUCH_DELAY: 1,
  HOLDING: 2,
  WAITING_FOR_CLICK: 3,
} as const
const EVENTS = [
  'click',
  'contextmenu',
  'pointercancel',
  'pointerdown',
  'pointerenter',
  'pointerleave',
  'pointerup',
] as const
export interface RippleProps extends ComponentProps<'div'> {
  disabled?: boolean
}
export function Ripple(props: RippleProps) {
  const [local, rest] = splitProps(props, ['disabled', 'class'])
  const [hovered, setHovered] = createSignal(false)
  const [pressed, setPressed] = createSignal(false)
  const [state, setState] = createSignal<typeof State[keyof typeof State]>(State.INACTIVE)
  let root: HTMLDivElement | undefined
  let growAnimation: Animation | undefined
  let rippleStartEvent: PointerEvent | undefined
  let rippleSize = ''
  let rippleScale = ''
  let initialSize = 0
  let rectCache: DOMRect | null = null
  const timeouts: number[] = []

  function getNormalizedPointerEventCoords(pointerEvent: PointerEvent): { x: number, y: number } {
    const { scrollX, scrollY } = window
    const rect = root!.getBoundingClientRect()
    const { left, top } = rect
    const documentX = scrollX + left
    const documentY = scrollY + top
    const { pageX, pageY } = pointerEvent
    const zoom = (root! as any).currentCSSZoom ?? 1
    return {
      x: (pageX - documentX) / zoom,
      y: (pageY - documentY) / zoom,
    }
  }

  function determineRippleSize() {
    const rect = root!.getBoundingClientRect()
    rectCache = rect
    const { height, width } = rect
    const maxDim = Math.max(height, width)
    const softEdgeSize = Math.max(SOFT_EDGE_CONTAINER_RATIO * maxDim, SOFT_EDGE_MINIMUM_SIZE)
    const zoom = (root! as any).currentCSSZoom ?? 1
    initialSize = Math.floor((maxDim * INITIAL_ORIGIN_SCALE) / zoom)
    const hypotenuse = Math.sqrt(width ** 2 + height ** 2)
    const maxRadius = hypotenuse + PADDING
    const maybeZoomedScale = (maxRadius + softEdgeSize) / initialSize
    rippleScale = `${maybeZoomedScale / zoom}`
    rippleSize = `${initialSize}px`
  }

  function getTranslationCoordinates(positionEvent?: Event) {
    const rect = rectCache || root!.getBoundingClientRect()
    const { height, width } = rect
    const zoom = (root! as any).currentCSSZoom ?? 1
    const endPoint = {
      x: (width / zoom - initialSize) / 2,
      y: (height / zoom - initialSize) / 2,
    }
    let startPoint
    if (positionEvent instanceof PointerEvent) {
      startPoint = getNormalizedPointerEventCoords(positionEvent)
    }
    else {
      startPoint = {
        x: width / zoom / 2,
        y: height / zoom / 2,
      }
    }
    startPoint = {
      x: startPoint.x - initialSize / 2,
      y: startPoint.y - initialSize / 2,
    }
    return { startPoint, endPoint }
  }

  function startPressAnimation(positionEvent?: Event) {
    if (!root)
      return
    setPressed(true)
    growAnimation?.cancel()
    determineRippleSize()
    const { startPoint, endPoint } = getTranslationCoordinates(positionEvent)
    const translateStart = `${startPoint.x}px, ${startPoint.y}px`
    const translateEnd = `${endPoint.x}px, ${endPoint.y}px`
    growAnimation = root.animate(
      {
        top: [0, 0],
        left: [0, 0],
        height: [rippleSize, rippleSize],
        width: [rippleSize, rippleSize],
        transform: [
          `translate(${translateStart}) scale(1)`,
          `translate(${translateEnd}) scale(${rippleScale})`,
        ],
      },
      {
        pseudoElement: PRESS_PSEUDO,
        duration: PRESS_GROW_MS,
        easing: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
        fill: ANIMATION_FILL,
      },
    )
  }

  async function endPressAnimation() {
    rippleStartEvent = undefined
    setState(State.INACTIVE)
    const animation = growAnimation
    let pressAnimationPlayState = Infinity
    if (typeof animation?.currentTime === 'number') {
      pressAnimationPlayState = animation.currentTime
    }
    else if (animation?.currentTime) {
      pressAnimationPlayState = animation.currentTime.to('ms').value
    }
    if (pressAnimationPlayState >= MINIMUM_PRESS_MS) {
      setPressed(false)
      return
    }
    const timeoutId = window.setTimeout(() => {
      const idx = timeouts.indexOf(timeoutId as unknown as number)
      if (idx > -1) {
        timeouts.splice(idx, 1)
      }
      if (growAnimation === animation) {
        setPressed(false)
      }
    }, MINIMUM_PRESS_MS - pressAnimationPlayState)
    timeouts.push(timeoutId as unknown as number)
  }

  function isTouch({ pointerType }: PointerEvent) {
    return pointerType === 'touch'
  }

  function shouldReactToEvent(event: PointerEvent) {
    if (local.disabled || !event.isPrimary) {
      return false
    }
    if (rippleStartEvent && rippleStartEvent.pointerId !== event.pointerId) {
      return false
    }
    if (event.type === 'pointerenter' || event.type === 'pointerleave') {
      return !isTouch(event)
    }
    const isPrimaryButton = event.buttons === 1
    return isTouch(event) || isPrimaryButton
  }

  function handlePointerenter(event: PointerEvent) {
    if (!shouldReactToEvent(event))
      return
    setHovered(true)
  }

  function handlePointerleave(event: PointerEvent) {
    if (!shouldReactToEvent(event))
      return
    setHovered(false)
    if (state() !== State.INACTIVE) {
      endPressAnimation()
    }
  }

  function handlePointerup(event: PointerEvent) {
    if (!shouldReactToEvent(event))
      return
    if (state() === State.HOLDING) {
      setState(State.WAITING_FOR_CLICK)
      return
    }
    if (state() === State.TOUCH_DELAY) {
      setState(State.WAITING_FOR_CLICK)
      startPressAnimation(rippleStartEvent)
    }
  }

  async function handlePointerdown(event: PointerEvent) {
    if (!shouldReactToEvent(event))
      return
    rippleStartEvent = event
    if (!isTouch(event)) {
      setState(State.WAITING_FOR_CLICK)
      startPressAnimation(event)
      return
    }
    setState(State.TOUCH_DELAY)
    const timeoutId = window.setTimeout(() => {
      const idx = timeouts.indexOf(timeoutId as unknown as number)
      if (idx > -1) {
        timeouts.splice(idx, 1)
      }
      if (untrack(() => state()) === State.TOUCH_DELAY) {
        setState(State.HOLDING)
        startPressAnimation(event)
      }
    }, TOUCH_DELAY_MS)
    timeouts.push(timeoutId as unknown as number)
  }

  function handleClick() {
    if (local.disabled)
      return
    if (state() === State.WAITING_FOR_CLICK) {
      endPressAnimation()
      return
    }
    if (state() === State.INACTIVE) {
      startPressAnimation()
      endPressAnimation()
    }
  }

  function handlePointercancel(event: PointerEvent) {
    if (!shouldReactToEvent(event))
      return
    endPressAnimation()
  }

  function handleContextmenu() {
    if (local.disabled)
      return
    endPressAnimation()
  }

  function handleEvent(event: Event) {
    if (window.matchMedia?.('(forced-colors: active)')?.matches) {
      return
    }
    switch (event.type) {
      case 'click':
        handleClick()
        break
      case 'contextmenu':
        handleContextmenu()
        break
      case 'pointercancel':
        handlePointercancel(event as PointerEvent)
        break
      case 'pointerdown':
        handlePointerdown(event as PointerEvent)
        break
      case 'pointerenter':
        handlePointerenter(event as PointerEvent)
        break
      case 'pointerleave':
        handlePointerleave(event as PointerEvent)
        break
      case 'pointerup':
        handlePointerup(event as PointerEvent)
        break
      default:
        break
    }
  }

  let parentElement: HTMLElement | null = null

  onMount(() => {
    parentElement = root?.parentElement || null
    if (parentElement) {
      for (const event of EVENTS) {
        parentElement.addEventListener(event, handleEvent as EventListener)
      }
    }
  })

  onCleanup(() => {
    for (const timeoutId of timeouts) {
      window.clearTimeout(timeoutId)
    }
    timeouts.length = 0
    if (parentElement) {
      for (const event of EVENTS) {
        parentElement.removeEventListener(event, handleEvent as EventListener)
      }
    }
    growAnimation?.cancel()
  })

  createEffect(() => {
    if (local.disabled) {
      batch(() => {
        setHovered(false)
        setPressed(false)
      })
    }
  })

  return (
    <div
      ref={root}
      class={b(
        {
          hovered: hovered(),
          pressed: pressed(),
          disabled: local.disabled,
        },
        local.class,
      )}
      {...rest}
      aria-hidden="true"
    />
  )
}
