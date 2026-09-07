import * as React from 'react'
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

/**
 * Names of the fields a schema will reject when left empty.
 *
 * Derived from the schema rather than declared per label, so the asterisks can
 * never disagree with what the form actually enforces — the usual failure of a
 * hand-maintained `required` prop.
 *
 * `.shape` survives `.refine()`, and `isOptional()` correctly treats
 * `.default()` as not-required: the user need not supply a value.
 */
function requiredFieldNames(schema: unknown): Set<string> {
  const shape = (
    schema as { shape?: Record<string, { isOptional?: () => boolean }> }
  )?.shape

  if (!shape) return new Set()

  return new Set(
    Object.entries(shape)
      .filter(([, field]) => field?.isOptional?.() === false)
      .map(([name]) => name)
  )
}

const RequiredFieldsContext = React.createContext<Set<string>>(new Set())

/**
 * The "required" marker.
 *
 * The asterisk is decoration — screen readers take the requirement from
 * `aria-required` on the control, and would otherwise announce a bare "star"
 * with nothing attached to it. Exported for the handful of forms that are not
 * react-hook-form based and so cannot derive it, such as the lookup dialog.
 */
export function RequiredMark() {
  return (
    <>
      <span aria-hidden='true' className='ms-0.5 text-destructive'>
        *
      </span>
      <span className='sr-only'>(required)</span>
    </>
  )
}

/**
 * Form provider.
 *
 * Required-field markers apply on their own: the schema is read off the
 * resolver react-hook-form already holds, so there is nothing to pass here and
 * nothing to keep in sync per field. It works as long as the form uses the
 * `zodResolver` from `@/lib/zod-resolver`; with any other resolver the schema
 * is simply unreachable and no markers appear.
 */
function Form<
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues = TFieldValues,
>(
  props: React.ComponentProps<
    typeof FormProvider<TFieldValues, TContext, TTransformedValues>
  >
) {
  // `_options` is react-hook-form internal, hence the defensive reads: a shape
  // change should cost the asterisks, never the form.
  const schema = (
    props.control as unknown as {
      _options?: { resolver?: { schema?: unknown } }
    }
  )?._options?.resolver?.schema

  const required = React.useMemo(() => requiredFieldNames(schema), [schema])

  return (
    <RequiredFieldsContext.Provider value={required}>
      <FormProvider {...props} />
    </RequiredFieldsContext.Provider>
  )
}

/** True when the current field is required by the form's schema. */
function useFieldIsRequired(): boolean {
  const required = React.useContext(RequiredFieldsContext)
  const { name } = React.useContext(FormFieldContext)

  return name !== undefined && required.has(name)
}

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

/** One field: label, control, description and message. Generates the ids that tie them together. */
function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot='form-item'
        className={cn('grid gap-2', className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

/**
 * A field label, turning red when the field is in error.
 *
 * Appends a required marker automatically when the schema says the field is
 * required — there is no `required` prop to pass or keep in sync.
 *
 * @see `src/lib/zod-resolver.ts`, which makes the schema reachable
 */
function FormLabel({
  className,
  children,
  required,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & {
  /** Overrides the value derived from the schema. */
  required?: boolean
}) {
  const { error, formItemId } = useFormField()
  const derived = useFieldIsRequired()
  const isRequired = required ?? derived

  return (
    <Label
      data-slot='form-label'
      data-error={!!error}
      className={cn('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    >
      {children}
      {isRequired && <RequiredMark />}
    </Label>
  )
}

/** Wires the control to its label, description and error, and sets `aria-invalid` and `aria-required`. */
function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const isRequired = useFieldIsRequired()

  return (
    <Slot
      data-slot='form-control'
      id={formItemId}
      // What actually conveys the requirement to assistive tech.
      aria-required={isRequired || undefined}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

/** Helper text below a field. Announced to screen readers via `aria-describedby`. */
function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot='form-description'
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

/** The field's validation error. Renders nothing when the field is valid. */
function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? '') : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot='form-message'
      id={formMessageId}
      className={cn('text-sm text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
