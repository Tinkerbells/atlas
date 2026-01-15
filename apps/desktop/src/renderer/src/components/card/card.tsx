import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'

import { cn } from '../utils'
import styles from './card.module.css'

export type CardVariant = 'elevated' | 'outline'

export interface CardProps extends ComponentProps<'div'> {
  variant?: CardVariant
}

function Root(props: CardProps) {
  const [local, rest] = splitProps(props, ['variant', 'class'])

  return (
    <div
      {...rest}
      data-variant={local.variant ?? 'elevated'}
      class={cn(styles.card, local.class)}
    />
  )
}

function Header(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <div {...rest} class={cn(styles.header, local.class)} />
}

function Title(props: ComponentProps<'h3'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <h3 {...rest} class={cn(styles.title, local.class)} />
}

function Description(props: ComponentProps<'p'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <p {...rest} class={cn(styles.description, local.class)} />
}

function Body(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <div {...rest} class={cn(styles.body, local.class)} />
}

function Footer(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class'])
  return <div {...rest} class={cn(styles.footer, local.class)} />
}

export const Card = {
  Root,
  Header,
  Title,
  Description,
  Body,
  Footer,
}
