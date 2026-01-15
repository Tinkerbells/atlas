import type { ComponentProps, JSXElement } from 'solid-js'

import { splitProps } from 'solid-js'

import type { FieldSize, FieldVariants } from '../field'

import { Field } from '../field'
import { cn } from '../utils'
import fieldStyles from '../field/field.module.css'

export type TextareaProps = ComponentProps<typeof Field.Textarea> & FieldVariants & {
  size?: FieldSize
  label?: string
  helperText?: string
  errorText?: string
  prefixIcon?: string | JSXElement
  suffixIcon?: string | JSXElement
}

export function Textarea(props: TextareaProps) {
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
    if (!local.prefixIcon) return null
    return typeof local.prefixIcon === 'string'
      ? <i class={cn(local.prefixIcon, fieldStyles.prefixIcon)} />
      : (
          <span class={fieldStyles.prefixIcon}>
            {local.prefixIcon}
          </span>
        )
  }

  const renderSuffixIcon = () => {
    if (!local.suffixIcon) return null
    return typeof local.suffixIcon === 'string'
      ? <i class={cn(local.suffixIcon, fieldStyles.suffixIcon)} />
      : (
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
      <Field.Textarea
        {...rest}
        placeholder={local.label ? ' ' : rest.placeholder}
      />
      {local.label ? <Field.Label>{local.label}</Field.Label> : null}
      {local.errorText
        ? (
            <Field.ErrorText>{local.errorText}</Field.ErrorText>
          )
        : local.helperText
          ? (
              <Field.HelperText>{local.helperText}</Field.HelperText>
            )
          : null}
      {renderSuffixIcon()}
    </Field.Root>
  )
}
