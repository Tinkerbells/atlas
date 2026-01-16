import type { ComponentProps, JSXElement } from 'solid-js'

import { splitProps } from 'solid-js'

import type { FieldSize, FieldVariants } from '../field'

import { cn } from '../utils'
import { Field } from '../field'
import fieldStyles from '../field/field.module.css'

export type InputProps = ComponentProps<typeof Field.Input> & FieldVariants & {
  size?: FieldSize
  label?: string
  helperText?: string
  errorText?: string
  prefixIcon?: string | JSXElement
  suffixIcon?: string | JSXElement
  invalid?: boolean
}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, [
    'size',
    'border',
    'round',
    'fill',
    'class',
    'label',
    'helperText',
    'errorText',
    'prefixIcon',
    'suffixIcon',
  ])

  const renderPrefixIcon = () => {
    if (!local.prefixIcon) {
      return null
    }
    if (typeof local.prefixIcon === 'string') {
      return <i class={cn(local.prefixIcon, fieldStyles.prefixIcon)} />
    }
    return (
      <span class={fieldStyles.prefixIcon}>
        {local.prefixIcon}
      </span>
    )
  }

  const renderSuffixIcon = () => {
    if (!local.suffixIcon) {
      return null
    }
    if (typeof local.suffixIcon === 'string') {
      return <i class={cn(local.suffixIcon, fieldStyles.suffixIcon)} />
    }
    return (
      <span class={fieldStyles.suffixIcon}>
        {local.suffixIcon}
      </span>
    )
  }

  return (
    <Field.Root
      size={local.size}
      border={local.border ?? true}
      round={local.round}
      fill={local.fill}
      prefixIcon={local.prefixIcon}
      suffixIcon={local.suffixIcon}
      invalid={props.invalid}
      disabled={props.disabled}
      required={props.required}
      readOnly={props.readOnly}
      class={local.class}
    >
      {renderPrefixIcon()}
      <Field.Input
        {...rest}
        placeholder={local.label ? ' ' : rest.placeholder}
      />
      {local.label ? <Field.Label>{local.label}</Field.Label> : null}
      {local.errorText
        ? (<Field.ErrorText>{local.errorText}</Field.ErrorText>)
        : local.helperText
          ? (<Field.HelperText>{local.helperText}</Field.HelperText>)
          : null}
      {renderSuffixIcon()}
    </Field.Root>
  )
}
