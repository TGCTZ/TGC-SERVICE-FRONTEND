import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm, type Resolver } from 'react-hook-form'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { fieldErrors } from '@/lib/handle-server-error'
import { perm, type PermissionResource } from '@/lib/permissions'
import { zodResolver } from '@/lib/zod-resolver'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import {
  createLookupRow,
  lookupOptionsQuery,
  updateLookupRow,
} from '../data/api'
import {
  type LookupConfig,
  type LookupField,
  type LookupOption,
  type LookupRow,
} from '../data/config'

/** Radix forbids an empty-string SelectItem value, so "no choice" needs a sentinel. */
const NONE = 'none'

/**
 * Validation for one lookup, derived from its config.
 *
 * Every extra field is held as a string in the form — an FK id and a price
 * included — and converted on submit. Keeping one representation avoids the
 * `undefined`/`NaN` churn `z.coerce.number()` produces while a number input is
 * mid-edit.
 */
function buildSchema(config: LookupConfig) {
  const extras: Record<string, z.ZodTypeAny> = {}

  for (const field of config.extraFields) {
    const base = z.string()
    extras[field.key] = field.required
      ? base.min(1, `${field.label} is required.`)
      : base.optional()
  }

  return z.object({
    name: z.string().min(1, 'Name is required.'),
    description: z.string().optional(),
    is_active: z.boolean().default(true),
    ...extras,
  })
}

type FormValues = Record<string, unknown>

/**
 * Convert one form value back to what the API stores.
 *
 * Blank means "no value" for anything the column holds as a number — an FK or a
 * price — and those columns are nullable, so a cleared field must send an
 * explicit `null`: `""` would be rejected as a bad number, and omitting the key
 * would silently keep the old value on a PUT.
 *
 * @param field - The config entry describing how the value is stored.
 * @param raw - Whatever the form currently holds for it.
 * @returns The value to send, or null for a cleared numeric column.
 */
function toPayloadValue(field: LookupField, raw: unknown): unknown {
  const value = typeof raw === 'string' ? raw.trim() : raw
  const isNumeric =
    field.type === 'number' ||
    field.type === 'money' ||
    Boolean(field.optionsFrom)

  if (value === '' || value === undefined) return isNumeric ? null : ''
  return isNumeric ? Number(value) : value
}

type LookupMutateDialogProps = {
  config: LookupConfig
  currentRow: LookupRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Render the same form as a read-only view. */
  readOnly?: boolean
  /** Switches a read-only view into edit mode, when the user may edit. */
  onRequestEdit?: () => void
  /** The record's row actions, shown in the footer of the read-only view. */
  actions?: RowAction[]
}

/**
 * Create/edit form for any lookup.
 *
 * Fields beyond the shared three come from the config's `extraFields`, so a new
 * lookup needs a config entry rather than a new dialog.
 */
export function LookupMutateDialog({
  config,
  currentRow,
  open,
  onOpenChange,
  readOnly = false,
  onRequestEdit,
  actions = [],
}: LookupMutateDialogProps) {
  const queryClient = useQueryClient()
  const isEdit = currentRow !== null

  // A hook cannot run inside `.map()`, so every reference list the config asks
  // for is fetched in one `useQueries` and looked up by resource below.
  const referenced = useMemo(
    () =>
      Array.from(
        new Set(
          config.extraFields
            .map((field) => field.optionsFrom)
            .filter((resource): resource is PermissionResource =>
              Boolean(resource)
            )
        )
      ),
    [config]
  )

  const results = useQueries({
    queries: referenced.map((resource) => lookupOptionsQuery(resource)),
  })

  const optionsByResource = new Map<PermissionResource, LookupOption[]>(
    referenced.map((resource, index) => [resource, results[index]?.data ?? []])
  )

  const form = useForm<FormValues>({
    // The schema is assembled from config at runtime, so its inferred shape
    // cannot line up with the open record this form is typed as.
    resolver: zodResolver(
      buildSchema(config)
    ) as unknown as Resolver<FormValues>,
    defaultValues: { is_active: true },
  })

  useEffect(() => {
    if (!open) return

    const row = currentRow as Record<string, unknown> | null
    form.reset({
      name: (row?.name as string) ?? '',
      description: (row?.description as string) ?? '',
      is_active: (row?.is_active as boolean) ?? true,
      ...Object.fromEntries(
        config.extraFields.map((field) => {
          const value = row?.[field.key]
          return [
            field.key,
            value === null || value === undefined ? '' : String(value),
          ]
        })
      ),
    })
  }, [open, currentRow, config, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: Record<string, unknown> = {
        name: values.name,
        description: values.description ?? '',
        is_active: values.is_active,
        ...Object.fromEntries(
          config.extraFields.map((field) => [
            field.key,
            toPayloadValue(field, values[field.key]),
          ])
        ),
      }

      return isEdit
        ? updateLookupRow(config.resource, currentRow.id, payload)
        : createLookupRow(config.resource, payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? 'Changes saved' : `Created "${row.name}"`)
      queryClient.invalidateQueries({ queryKey: ['lookups', config.resource] })
      // Other forms draw their dropdowns from this table, so refresh them too.
      queryClient.invalidateQueries({ queryKey: ['lookup'] })
      onOpenChange(false)
    },
    onError: (error) => {
      const fields = fieldErrors(error)
      if (fields) {
        for (const [field, messages] of Object.entries(fields)) {
          form.setError(field, { message: messages[0] })
        }
        toast.error('Please fix the highlighted fields.')
        return
      }

      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to do that.')
        return
      }

      toast.error('Something went wrong. Please try again.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {readOnly
              ? currentRow?.name
              : `${isEdit ? 'Edit' : 'Add'} ${config.title.toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Viewing the record. Choose Edit to make changes.'
              : config.description}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Form {...form}>
            <form
              id='lookup-form'
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className='px-1'
            >
              {/* One fieldset disables every control, Radix triggers included. */}
              <fieldset disabled={readOnly} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? '')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {config.extraFields.map((extra) => (
                  <ExtraField
                    key={extra.key}
                    control={form.control}
                    field={extra}
                    options={
                      extra.optionsFrom
                        ? optionsByResource.get(extra.optionsFrom)
                        : undefined
                    }
                  />
                ))}

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          {...field}
                          value={String(field.value ?? '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='is_active'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center gap-2'>
                      <FormControl>
                        <Switch
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className='!mt-0 font-normal'>
                        Active
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </fieldset>
            </form>
          </Form>
        </DialogBody>

        <DialogFooter>
          {readOnly ? (
            <ViewFooterActions
              actions={actions}
              primary={
                onRequestEdit && (
                  <Can permission={perm(config.resource, 'change')}>
                    <Button onClick={onRequestEdit}>
                      <Pencil className='me-1 size-4' />
                      Edit
                    </Button>
                  </Can>
                )
              }
            />
          ) : (
            <>
              <Button
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                form='lookup-form'
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ExtraFieldProps = {
  // Loosely typed on purpose: the form's shape is built from config at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  field: LookupField
  options?: LookupOption[]
}

/**
 * Render one configured extra field as the control its type calls for.
 *
 * A `select` draws its choices from the config's static `options` (an API enum
 * with no endpoint of its own) or from another reference table via
 * `optionsFrom`; the two are interchangeable here because both reduce to a
 * `{value,label}` list.
 */
function ExtraField({ control, field, options }: ExtraFieldProps) {
  const choices =
    field.options ??
    options?.map((option) => ({
      value: String(option.id),
      label: option.name,
    })) ??
    []

  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: input }) => (
        <FormItem>
          <FormLabel>{field.label}</FormLabel>

          {field.type === 'select' ? (
            <Select
              value={input.value ? String(input.value) : NONE}
              onValueChange={(value) =>
                input.onChange(value === NONE ? '' : value)
              }
            >
              <FormControl>
                <SelectTrigger className='w-full'>
                  <SelectValue
                    placeholder={`Select ${field.label.toLowerCase()}`}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {!field.required && <SelectItem value={NONE}>None</SelectItem>}
                {choices.map((choice) => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <FormControl>
              <Input
                type={
                  field.type === 'color'
                    ? 'color'
                    : field.type === 'number' || field.type === 'money'
                      ? 'number'
                      : 'text'
                }
                // A decimal column: without a step the browser rejects
                // anything but whole numbers.
                step={field.type === 'money' ? '0.01' : undefined}
                min={
                  field.type === 'money' || field.type === 'number'
                    ? '0'
                    : undefined
                }
                placeholder={field.placeholder}
                className={field.type === 'color' ? 'h-9 w-20 p-1' : undefined}
                {...input}
                value={String(input.value ?? '')}
              />
            </FormControl>
          )}

          {field.type === 'money' && (
            <FormDescription>Leave blank if not yet priced.</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
