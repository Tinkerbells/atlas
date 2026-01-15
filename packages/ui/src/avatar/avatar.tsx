import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'
import { Avatar as ArkAvatar } from '@ark-ui/solid/avatar'

import { cn } from '../utils'
import styles from './avatar.module.css'

export type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarRootProps extends ComponentProps<typeof ArkAvatar.Root> {
  size?: AvatarSize
}

function Root(props: AvatarRootProps) {
  const [local, rest] = splitProps(props, ['size', 'class'])

  return (
    <ArkAvatar.Root
      {...rest}
      data-size={local.size ?? 'md'}
      class={cn(styles.root, local.class)}
    />
  )
}

function Image(props: ComponentProps<typeof ArkAvatar.Image>) {
  return <ArkAvatar.Image {...props} class={cn(styles.image, props.class)} />
}

function Fallback(props: ComponentProps<typeof ArkAvatar.Fallback>) {
  return (
    <ArkAvatar.Fallback
      {...props}
      class={cn(styles.fallback, props.class)}
    />
  )
}

export const Avatar = {
  Root,
  RootProvider: ArkAvatar.RootProvider,
  Context: ArkAvatar.Context,
  Image,
  Fallback,
}
