import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { cn } from '../../utils'
import { formatStyleVars, styleVarsToString, type StyleVars } from '../../utils/styleVars'
import type { StyleProviderProps } from './props'
import styles from './styles.module.css'

const STYLE_VARS_ID = 'style-vars'

export function applyStyleVars(styleVars?: StyleVars | null) {
  if (typeof document === 'undefined') return

  const existing = document.head.querySelector<HTMLStyleElement>(`#${STYLE_VARS_ID}`)

  if (styleVars == null) {
    if (existing) existing.remove()
    return
  }

  const content = styleVarsToString(styleVars)

  if (existing) {
    existing.textContent = content
    return
  }

  const style = document.createElement('style')
  style.id = STYLE_VARS_ID
  style.textContent = content
  document.head.appendChild(style)
}

export const StyleProvider = (props: StyleProviderProps) => {
  const [local, rest] = splitProps(props, ['styleVars', 'as', 'class', 'children'])
  const Component = () => local.as ?? 'div'

  return (
    <Dynamic component={Component()} class={cn(styles.root, local.class)} style={formatStyleVars(local.styleVars)} {...rest}>
      {local.children}
    </Dynamic>
  )
}

export type { StyleVars } from '../../utils/styleVars'
export type { StyleProviderProps } from './props'
export default StyleProvider
