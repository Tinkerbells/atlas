import type { ComponentProps, JSXElement } from 'solid-js'

import { Field as ArkField } from '@ark-ui/solid/field'
import { createMemo, mergeProps, splitProps } from 'solid-js'

import { cn } from '../utils'
import cls from './field.module.css'

export type FieldSize = 'sm' | 'md' | 'lg'

export interface FieldVariants {
  variant?: 'outlined' | 'outlined-rounded' | 'filled'
}

type WithFieldProps<T> = T & {
  size?: FieldSize
  prefixIcon?: string | JSXElement
  suffixIcon?: string | JSXElement
} & Partial<FieldVariants>

const sizes = {
  sm: cls.small,
  md: cls.medium,
  lg: cls.large,
}

const variants = {
  'outlined': cls.outlined,
  'outlined-rounded': cls['outlined-rounded'],
  'filled': cls.filled,
}

function Root(props: WithFieldProps<ComponentProps<typeof ArkField.Root>>) {
  const merged = mergeProps({ variant: 'outlined' as const, size: 'md' as const }, props)
  const [local, rest] = splitProps(merged, [
    'size',
    'variant',
    'class',
    'prefixIcon',
    'suffixIcon',
    'invalid',
    'children',
  ])

  const size = createMemo(() => sizes[local.size])

  const variant = createMemo(() =>
    variants[local.variant],
  )

  return (
    <ArkField.Root
      {...rest}
      invalid={local.invalid}
      class={cn(
        cls.root,
        size(),
        variant(),
        local.prefixIcon ? cls.prefix : undefined,
        local.suffixIcon ? cls.suffix : undefined,
        local.invalid && cls.invalid,
        local.class,
      )}
    >
      {local.children}
    </ArkField.Root>
  )
}

function Label(props: ComponentProps<typeof ArkField.Label>) {
  const [local, rest] = splitProps(props, ['class'])
  return <ArkField.Label {...rest} class={cn(cls.label, local.class)} />
}

function Input(props: ComponentProps<typeof ArkField.Input>) {
  const [local, rest] = splitProps(props, ['class'])
  return <ArkField.Input {...rest} class={cn(cls.control, local.class)} />
}

function Textarea(props: ComponentProps<typeof ArkField.Textarea>) {
  const [local, rest] = splitProps(props, ['class'])
  return <ArkField.Textarea {...rest} class={cn(cls.control, local.class)} />
}

function Select(props: ComponentProps<typeof ArkField.Select>) {
  const [local, rest] = splitProps(props, ['class'])
  return <ArkField.Select {...rest} class={cn(cls.control, local.class)} />
}

function HelperText(props: ComponentProps<typeof ArkField.HelperText>) {
  const [local, rest] = splitProps(props, ['class'])
  return <ArkField.HelperText {...rest} class={cn(cls.helper, local.class)} />
}

function ErrorText(props: ComponentProps<typeof ArkField.ErrorText>) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ArkField.ErrorText
      {...rest}
      class={cn(cls.helper, cls.invalidText, local.class)}
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
