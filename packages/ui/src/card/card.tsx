import type { ComponentProps } from 'solid-js'

import { createContext, createMemo, mergeProps, Show, splitProps, useContext } from 'solid-js'

import { cn } from '../utils'
import styles from './card.module.css'

export type CardVariant = 'elevated' | 'outlined' | 'filled'
export type CardSpacing = 'compact' | 'comfortable' | 'expanded'

interface CardContextValue {
  spacing?: CardSpacing
}

const CardContext = createContext<() => CardContextValue | undefined>()
const useCardContext = () => useContext(CardContext)

export interface CardProps extends ComponentProps<'div'> {
  variant?: CardVariant
  spacing?: CardSpacing
  /**
   * Optional media slot, rendered above body content.
   */
  media?: ComponentProps<'div'>['children']
  /**
   * Optional header area; if omitted, Title/Description are still allowed as children.
   */
  header?: ComponentProps<'div'>['children']
  /**
   * Optional footer actions area.
   */
  footer?: ComponentProps<'div'>['children']
}

function Root(allProps: CardProps) {
  const context = useCardContext()
  const defaultProps = {
    variant: 'elevated' as CardVariant,
    spacing: 'comfortable' as CardSpacing,
  }
  const merged = mergeProps(defaultProps, context?.() ?? {}, allProps)
  const [local, rest] = splitProps(merged, [
    'variant',
    'spacing',
    'class',
    'children',
    'media',
    'header',
    'footer',
  ])

  const contextValue = createMemo(() => ({
    spacing: local.spacing,
  }))

  return (
    <CardContext.Provider value={contextValue}>
      <div
        {...rest}
        data-variant={local.variant}
        data-spacing={local.spacing}
        class={cn(styles.card, local.class)}
      >
        <Show when={local.media}>
          <div class={styles.media}>{local.media}</div>
        </Show>
        <Show when={local.header}>
          <Header>{local.header}</Header>
        </Show>
        {local.children}
        <Show when={local.footer}>
          <Footer>{local.footer}</Footer>
        </Show>
      </div>
    </CardContext.Provider>
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
  const context = useCardContext()
  return (
    <div
      {...rest}
      data-spacing={context?.()?.spacing}
      class={cn(styles.body, local.class)}
    />
  )
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
