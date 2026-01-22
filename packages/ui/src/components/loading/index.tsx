import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import styles from './styles.module.css'

export type LoadingType = 'circle'

export interface LoadingProps extends JSX.HTMLAttributes<HTMLDivElement> {
  type?: LoadingType
  size?: number | string
  color?: string
  radius?: number | string
  cover?: boolean
}

export const Loading = (props: LoadingProps) => {
  const [local, rest] = splitProps(props, ['type', 'size', 'color', 'radius', 'cover', 'class'])

  const style = () => ({
    width: local.size ? toPx(local.size) : undefined,
    height: local.size ? toPx(local.size) : undefined,
    color: local.color,
    borderRadius: local.radius ? toPx(local.radius) : undefined,
  })

  return (
    <div
      {...rest}
      class={[styles.loading, local.cover && styles.cover, local.class].filter(Boolean).join(' ')}
      style={style()}
    >
      <span class={styles.spinner} />
    </div>
  )
}

function toPx(value: number | string) {
  return typeof value === 'number' ? `${value}px` : value
}

export default Loading
