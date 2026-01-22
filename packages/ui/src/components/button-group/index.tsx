import { splitProps } from 'solid-js'
import { createNamespace } from '../../utils/namespace'
import type { ButtonGroupProps } from './props'
import { ButtonGroupProvider } from './context'
import styles from './styles.module.css'

const { n, bem } = createNamespace('var-button-group', styles)

function formatElevation(elevation: boolean | number | string | undefined) {
  if (elevation === false) return ''
  if (elevation === true || elevation == null) return 'var-elevation--2'
  const num = Number(elevation)
  if (!Number.isNaN(num)) return `var-elevation--${num}`
  return String(elevation)
}

export const ButtonGroup = (props: ButtonGroupProps) => {
  const [local, rest] = splitProps(props, [
    'type',
    'size',
    'color',
    'textColor',
    'mode',
    'elevation',
    'vertical',
    'class',
    'children',
  ])

  const mode = () => local.mode ?? 'normal'
  const vertical = () => !!local.vertical

  const ctx = {
    type: () => local.type ?? 'default',
    size: () => local.size ?? 'normal',
    color: () => local.color,
    textColor: () => local.textColor,
    mode,
    elevation: () => local.elevation ?? true,
  }

  return (
    <ButtonGroupProvider value={ctx}>
      <div
        {...rest}
        class={bem(
          n(),
          vertical() ? n('--vertical') : n('--horizontal'),
          n(`--mode-${mode()}`),
          mode() === 'normal' && formatElevation(local.elevation),
          local.class,
        )}
      >
        {local.children}
      </div>
    </ButtonGroupProvider>
  )
}

export type { ButtonGroupProps } from './props'
export default ButtonGroup
