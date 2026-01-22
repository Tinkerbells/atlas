import { onCleanup } from 'solid-js'
import styles from './styles.module.css'

export interface RippleOptions {
  color?: string
  disabled?: boolean
}

const ANIMATION_DURATION = 250

function setHostStyles(el: HTMLElement) {
  const computed = getComputedStyle(el)
  el.style.overflow = 'hidden'
  el.style.overflowX = 'hidden'
  el.style.overflowY = 'hidden'
  if (computed.position === 'static') el.style.position = 'relative'
  if (computed.zIndex === 'auto') el.style.zIndex = '1'
}

function computeRipple(el: HTMLElement, event: PointerEvent | KeyboardEvent) {
  const rect = el.getBoundingClientRect()
  const radius = Math.sqrt(rect.width ** 2 + rect.height ** 2) / 2
  const size = radius * 2

  const localX = 'clientX' in event ? event.clientX - rect.left : rect.width / 2
  const localY = 'clientY' in event ? event.clientY - rect.top : rect.height / 2

  const x = localX - radius
  const y = localY - radius
  const centerX = (rect.width - size) / 2
  const centerY = (rect.height - size) / 2

  return { x, y, centerX, centerY, size }
}

function createRipple(el: HTMLElement, event: PointerEvent | KeyboardEvent, color?: string) {
  const { x, y, centerX, centerY, size } = computeRipple(el, event)
  const ripple = document.createElement('div')
  ripple.className = styles['var-ripple'] ?? 'var-ripple'
  ripple.style.width = ripple.style.height = `${size}px`
  ripple.style.transform = `translate(${x}px, ${y}px) scale3d(.3, .3, .3)`
  ripple.style.opacity = `0`
  ripple.dataset.createdAt = String(performance.now())
  ripple.style.setProperty('--ripple-color', color ?? 'currentColor')

  setHostStyles(el)
  el.appendChild(ripple)

  window.setTimeout(() => {
    ripple.style.transform = `translate(${centerX}px, ${centerY}px) scale3d(1, 1, 1)`
    ripple.style.opacity = `.25`
  }, 20)
}

function removeRipple(el: HTMLElement) {
  const ripples = el.querySelectorAll<HTMLElement>(`.${styles['var-ripple'] ?? 'var-ripple'}`)
  if (!ripples.length) return

  const last = ripples[ripples.length - 1]
  const delay = ANIMATION_DURATION - performance.now() + Number(last.dataset.createdAt)

  window.setTimeout(() => {
    last.style.opacity = `0`
    window.setTimeout(() => last.remove(), ANIMATION_DURATION)
  }, delay)
}

export function useRipple(el: () => HTMLElement | undefined, options: () => RippleOptions) {
  let tasker: number | null = null
  let hasKeyboardRipple = false

  const pointerDown = (e: PointerEvent) => {
    if (options().disabled) return
    tasker && window.clearTimeout(tasker)
    if (e.pointerType === 'touch') {
      tasker = window.setTimeout(() => {
        tasker = null
        createRipple(el()!, e, options().color)
      }, 30)
    } else {
      createRipple(el()!, e, options().color)
    }
  }

  const pointerMove = () => {
    if (tasker) {
      window.clearTimeout(tasker)
      tasker = null
    }
  }

  const pointerUp = () => {
    if (tasker) {
      window.clearTimeout(tasker)
      tasker = null
    }
    const host = el()
    if (host) removeRipple(host)
  }

  const keyDown = (e: KeyboardEvent) => {
    if (options().disabled) return
    if (hasKeyboardRipple) return
    if (e.key !== ' ' && e.key !== 'Enter') return
    createRipple(el()!, e, options().color)
    hasKeyboardRipple = true
  }

  const keyUp = () => {
    if (!hasKeyboardRipple) return
    hasKeyboardRipple = false
    const host = el()
    if (host) removeRipple(host)
  }

  const register = () => {
    const host = el()
    if (!host) return
    host.addEventListener('pointerdown', pointerDown, { passive: true })
    host.addEventListener('pointermove', pointerMove, { passive: true })
    host.addEventListener('pointerup', pointerUp, { passive: true })
    host.addEventListener('pointercancel', pointerUp, { passive: true })
    host.addEventListener('dragstart', pointerUp, { passive: true })
    host.addEventListener('keydown', keyDown)
    host.addEventListener('keyup', keyUp)
    host.addEventListener('blur', keyUp)

    document.addEventListener('touchend', pointerUp, { passive: true })
    document.addEventListener('touchcancel', pointerUp, { passive: true })
    document.addEventListener('dragend', pointerUp, { passive: true })
  }

  register()

  onCleanup(() => {
    const host = el()
    if (host) {
      host.removeEventListener('pointerdown', pointerDown)
      host.removeEventListener('pointermove', pointerMove)
      host.removeEventListener('pointerup', pointerUp)
      host.removeEventListener('pointercancel', pointerUp)
      host.removeEventListener('dragstart', pointerUp)
      host.removeEventListener('keydown', keyDown)
      host.removeEventListener('keyup', keyUp)
      host.removeEventListener('blur', keyUp)
    }
    document.removeEventListener('touchend', pointerUp)
    document.removeEventListener('touchcancel', pointerUp)
    document.removeEventListener('dragend', pointerUp)
  })
}

export default useRipple
