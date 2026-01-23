import '@/styles/common.scss'

import type { Accessor, JSX } from 'solid-js'

import { createEffect } from 'solid-js'

import { NAMESPACE } from '@/utils/bem'

import type { StyleVars } from './format-style-vars'

import { formatStyleVars } from './format-style-vars'

interface StyleProviderProps {
  theme: Accessor<StyleVars>
  children: JSX.Element
}

export function StyleProvider(props: StyleProviderProps) {
  createEffect(() => {
    const head = document.head
    const styleId = `${NAMESPACE}style-vars`

    const existing = head.querySelector(`#${styleId}`)
    if (existing)
      existing.remove()

    const currentTheme = props.theme()

    if (currentTheme) {
      const style = document.createElement('style')
      style.id = styleId

      const formattedVars = formatStyleVars(currentTheme)

      const content = Object.entries(formattedVars).reduce(
        (css, [key, value]) => `${css}${key}:${value};`,
        ':root:root {',
      )

      style.innerHTML = `${content}}`
      head.appendChild(style)
    }
  })

  return props.children
}
