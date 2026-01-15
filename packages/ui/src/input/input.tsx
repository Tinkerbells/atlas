import type { ComponentProps } from 'solid-js'

import { splitProps } from 'solid-js'

import type { FieldSize, FieldVariant } from '../field'

import { Field } from '../field'

export interface InputProps extends ComponentProps<typeof Field.Input> {
  size?: FieldSize
  variant?: FieldVariant
  label?: string
  helperText?: string
  errorText?: string
  prefixIcon?: string
  suffixIcon?: string
  invalid?: boolean
}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, [
    'size',
    'variant',
    'class',
    'label',
    'helperText',
    'errorText',
    'prefixIcon',
    'suffixIcon',
  ])

  return (
    <Field.Root
      size={local.size}
      variant={local.variant ?? 'border'}
      prefixIcon={local.prefixIcon}
      suffixIcon={local.suffixIcon}
      invalid={props.invalid}
      disabled={props.disabled}
      required={props.required}
      readOnly={props.readOnly}
      class={local.class}
    >
      {local.prefixIcon ? <i class={local.prefixIcon} /> : null}
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
      {local.suffixIcon ? <i class={local.suffixIcon} /> : null}
    </Field.Root>
  )
}
