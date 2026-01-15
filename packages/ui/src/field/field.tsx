import type { ComponentProps, JSXElement } from 'solid-js'

import { splitProps } from 'solid-js'
import { Field as ArkField } from '@ark-ui/solid/field'

import { cn } from '../utils'
import styles from './field.module.css'

export type FieldSize = 'sm' | 'md' | 'lg' | 'extra'

export interface FieldVariants {
  border?: boolean
  round?: boolean
  fill?: boolean
}

type WithFieldProps<T> = T & {
  size?: FieldSize
  prefixIcon?: string | JSXElement
  suffixIcon?: string | JSXElement
} & FieldVariants

function Root(props: WithFieldProps<ComponentProps<typeof ArkField.Root>>) {
  const [local, rest] = splitProps(props, [
    'size',
    'border',
    'round',
    'fill',
    'class',
    'prefixIcon',
    'suffixIcon',
    'invalid',
  ])

  const sizeClass = () =>
    local.size === 'sm'
      ? styles.small
      : local.size === 'lg'
        ? styles.large
        : local.size === 'extra'
          ? styles.extra
          : undefined

  const variantClasses = () => [
    local.border ? styles.border : undefined,
    local.round ? styles.round : undefined,
    local.fill ? styles.fill : undefined,
    local.prefixIcon ? styles.prefix : undefined,
    local.suffixIcon ? styles.suffix : undefined,
  ]

  return (
    <ArkField.Root
      {...rest}
      invalid={local.invalid}
      class={cn(
        styles.root,
        sizeClass(),
        variantClasses().filter(Boolean).join(' '),
        local.invalid && styles.invalid,
        local.class,
      )}
    />
  )
}

function Label(props: ComponentProps<typeof ArkField.Label>) {
  const [local, rest] = splitProps(props, ['class'])
  return <ArkField.Label {...rest} class={cn(styles.label, local.class)} />
}

function Input(props: ComponentProps<typeof ArkField.Input>) {
  const [local, rest] = splitProps(props, ['class'])
  return <ArkField.Input {...rest} class={cn(styles.control, local.class)} />
}

function Textarea(props: ComponentProps<typeof ArkField.Textarea>) {
  const [local, rest] = splitProps(props, ['class'])
  return <ArkField.Textarea {...rest} class={cn(styles.control, local.class)} />
}

function Select(props: ComponentProps<typeof ArkField.Select>) {
  const [local, rest] = splitProps(props, ['class'])
  return <ArkField.Select {...rest} class={cn(styles.control, local.class)} />
}

function HelperText(props: ComponentProps<typeof ArkField.HelperText>) {
  const [local, rest] = splitProps(props, ['class'])
  return <ArkField.HelperText {...rest} class={cn(styles.helper, local.class)} />
}

function ErrorText(props: ComponentProps<typeof ArkField.ErrorText>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkField.ErrorText
      {...rest}
      class={cn(styles.helper, styles.invalidText, local.class)}
    />
  )
}

export const Field = {
  Root,
  Label,
  Input,
  Textarea,
  Select,
  HelperText,
  ErrorText,
  RootProvider: ArkField.RootProvider,
  Context: ArkField.Context,
}
