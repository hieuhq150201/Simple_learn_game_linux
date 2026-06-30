'use client'

import * as React from 'react'
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

const Form = FormProvider

// ── FormField ────────────────────────────────────────────────────────────────

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = { name: TName }

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) throw new Error('useFormField must be used within <FormField>')

  const { id } = itemContext
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

// ── FormItem ─────────────────────────────────────────────────────────────────

type FormItemContextValue = { id: string }
const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId()
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn('flex flex-col gap-2', className)} {...props} />
    </FormItemContext.Provider>
  )
}

// ── FormLabel ────────────────────────────────────────────────────────────────

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()
  return (
    <Label
      htmlFor={formItemId}
      className={cn(error && 'text-destructive', className)}
      {...props}
    />
  )
}

// ── FormControl ──────────────────────────────────────────────────────────────

function FormControl({ ...props }: React.ComponentProps<'div'>) {
  const { error, formItemId, formMessageId } = useFormField()
  return (
    <div
      id={formItemId}
      aria-describedby={error ? formMessageId : undefined}
      aria-invalid={!!error}
      {...props}
    />
  )
}

// ── FormDescription ──────────────────────────────────────────────────────────

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formMessageId } = useFormField()
  return (
    <p
      id={formMessageId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

// ── FormMessage ──────────────────────────────────────────────────────────────

function FormMessage({ className, children, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? '') : children
  if (!body) return null
  return (
    <p
      id={formMessageId}
      className={cn('text-destructive text-sm', className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
}
