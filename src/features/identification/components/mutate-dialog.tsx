import { useEffect } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { fieldErrors, serverMessageOr } from '@/lib/handle-server-error'
import { perm, type PermissionResource } from '@/lib/permissions'
import { zodResolver } from '@/lib/zod-resolver'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { lookupOptionsQuery } from '@/features/lookups/data/api'
import { createReport, findingsWorklistQuery, updateReport } from '../data/api'
import {
  NATURE_TYPES,
  OPTIC_CHARACTERS,
  TRANSPARENCIES,
  TREATMENTS,
  type EnumOption,
} from '../data/enums'
import { type IdentificationReport } from '../data/schema'
import { InstrumentsPanel } from './instruments-panel'

/** Radix forbids an empty-string SelectItem value, so "not recorded" needs one. */
const NONE = 'none'

/** The reference tables the classification section draws on. */
const RELATED: { name: string; label: string; resource: PermissionResource }[] =
  [
    { name: 'species', label: 'Species', resource: 'species' },
    { name: 'variety', label: 'Variety', resource: 'varieties' },
    { name: 'color', label: 'Colour', resource: 'colors' },
    { name: 'origin', label: 'Origin', resource: 'origins' },
    { name: 'shape_cut', label: 'Shape / cut', resource: 'shape-cuts' },
  ]

/**
 * Everything is optional except the stone.
 *
 * That mirrors the model: a report is built up over a sitting at the bench, and
 * a stone may defeat one test while answering another. Validating findings as
 * required here would block saving work in progress.
 */
const reportFormSchema = z.object({
  stone: z.string().min(1, 'Stone is required.'),

  species: z.string().optional(),
  variety: z.string().optional(),
  color: z.string().optional(),
  origin: z.string().optional(),
  shape_cut: z.string().optional(),

  nature_type: z.string().optional(),
  transparency: z.string().optional(),
  treatment: z.string().optional(),
  optic_character: z.string().optional(),

  dimensions: z.string().optional(),
  refractive_index: z.string().optional(),
  specific_gravity: z.string().optional(),
  is_polished: z.boolean().default(false),
  conclusion: z.string().optional(),
})

type FormValues = z.input<typeof reportFormSchema>

/** A blank FK or decimal is null on the server, not an empty string. */
function idOrNull(value: string | undefined): number | null {
  return value ? Number(value) : null
}

type ReportMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: IdentificationReport | null
  /** Render the same form as a read-only view. */
  readOnly?: boolean
  /** Switches a read-only view into edit mode, when the user may edit. */
  onRequestEdit?: () => void
  /** The record's row actions, shown in the footer of the read-only view. */
  actions?: RowAction[]
  /**
   * Preselected stone, when the dialog is opened from the findings queue.
   *
   * Only meaningful while creating; the select still renders, so the choice
   * stays visible and changeable.
   */
  initialStone?: number
}

export function ReportMutateDialog({
  open,
  onOpenChange,
  currentRow,
  readOnly = false,
  onRequestEdit,
  actions = [],
  initialStone,
}: ReportMutateDialogProps) {
  const isEdit = Boolean(currentRow)
  const queryClient = useQueryClient()

  // One hook for all five reference lists; a hook cannot run inside `.map()`.
  const related = useQueries({
    queries: RELATED.map((entry) => lookupOptionsQuery(entry.resource)),
  })

  // Only needed while creating: the endpoint encodes "paid, not yet finalized".
  const { data: worklist = [] } = useQuery({
    ...findingsWorklistQuery(),
    enabled: open && !isEdit,
  })

  // A finalized report is locked by the service, so the form is read-only
  // whether or not the caller asked for a view.
  const isLocked = readOnly || Boolean(currentRow?.is_finalized)

  const form = useForm<FormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { stone: '', is_polished: false },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      stone: currentRow
        ? String(currentRow.stone)
        : initialStone
          ? String(initialStone)
          : '',
      species: currentRow?.species ? String(currentRow.species) : '',
      variety: currentRow?.variety ? String(currentRow.variety) : '',
      color: currentRow?.color ? String(currentRow.color) : '',
      origin: currentRow?.origin ? String(currentRow.origin) : '',
      shape_cut: currentRow?.shape_cut ? String(currentRow.shape_cut) : '',
      nature_type: currentRow?.nature_type ?? '',
      transparency: currentRow?.transparency ?? '',
      treatment: currentRow?.treatment ?? '',
      optic_character: currentRow?.optic_character ?? '',
      dimensions: currentRow?.dimensions ?? '',
      refractive_index: currentRow?.refractive_index ?? '',
      specific_gravity: currentRow?.specific_gravity ?? '',
      is_polished: currentRow?.is_polished ?? false,
      conclusion: currentRow?.conclusion ?? '',
    })
  }, [open, currentRow, initialStone, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        species: idOrNull(values.species),
        variety: idOrNull(values.variety),
        color: idOrNull(values.color),
        origin: idOrNull(values.origin),
        shape_cut: idOrNull(values.shape_cut),

        // Enums are blank strings when unrecorded, not null: the columns are
        // `blank=True, default=""` rather than nullable.
        nature_type: values.nature_type ?? '',
        transparency: values.transparency ?? '',
        treatment: values.treatment ?? '',
        optic_character: values.optic_character ?? '',

        dimensions: values.dimensions ?? '',
        refractive_index: values.refractive_index ?? '',
        specific_gravity: values.specific_gravity?.trim()
          ? values.specific_gravity.trim()
          : null,
        is_polished: values.is_polished,
        conclusion: values.conclusion ?? '',
      }

      // `stone` rides along on the update too: it is a required field on the
      // serializer, so a PUT without it is rejected before the service ever
      // sees the findings. The service then discards it — a report cannot move
      // between stones — but the request must still carry it.
      const stone = Number(values.stone)

      return currentRow
        ? updateReport(currentRow.id, { ...payload, stone })
        : createReport({ ...payload, stone })
    },
    onSuccess: (report) => {
      toast.success(
        isEdit ? 'Findings saved' : `Opened ${report.report_number}`
      )
      queryClient.invalidateQueries({ queryKey: ['identification-reports'] })
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      onOpenChange(false)
    },
    onError: (error) => {
      const fields = fieldErrors(error)
      if (fields) {
        for (const [field, messages] of Object.entries(fields)) {
          form.setError(field as keyof FormValues, { message: messages[0] })
        }
        toast.error('Please fix the highlighted fields.')
        return
      }

      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to do that.')
        return
      }

      // An unpaid bill and a finalized report are both refused by name — the
      // API's sentence is the clearest explanation the user will get.
      toast.error(
        serverMessageOr(error, 'Could not save the findings. Please try again.')
      )
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-3xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            {readOnly
              ? currentRow?.report_number
              : isEdit
                ? 'Edit findings'
                : 'Record findings'}
            {currentRow?.is_finalized && <Badge>Finalized</Badge>}
          </DialogTitle>
          <DialogDescription>
            {currentRow
              ? `Stone ${currentRow.stone_label} · ${currentRow.order_reference}`
              : 'Only paid stones without finished findings can be opened.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Form {...form}>
            <form
              id='report-form'
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className='px-1'
            >
              {/* One fieldset disables every control, Radix triggers included. */}
              <fieldset disabled={isLocked} className='space-y-6'>
                <section className='space-y-4'>
                  <h3 className='text-sm font-medium'>Subject</h3>
                  <FormField
                    control={form.control}
                    name='stone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stone</FormLabel>
                        {isEdit ? (
                          <FormControl>
                            <Input
                              readOnly
                              value={`${currentRow?.stone_label ?? ''} · ${currentRow?.order_reference ?? ''}`}
                            />
                          </FormControl>
                        ) : (
                          <Select
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Select a stone awaiting findings' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {worklist.map((stone) => (
                                <SelectItem
                                  key={stone.id}
                                  value={String(stone.id)}
                                >
                                  {stone.order_reference} · {stone.label} ·{' '}
                                  {stone.stone_type_detail?.name ?? 'Untyped'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {isEdit ? (
                          <FormDescription>
                            A report cannot be moved to another stone.
                          </FormDescription>
                        ) : (
                          worklist.length === 0 && (
                            <FormDescription>
                              Nothing is waiting — a stone appears here once its
                              bill is settled.
                            </FormDescription>
                          )
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <Separator />

                <section className='space-y-4'>
                  <h3 className='text-sm font-medium'>Classification</h3>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    {RELATED.map((entry, index) => (
                      <OptionField
                        key={entry.name}
                        control={form.control}
                        name={entry.name}
                        label={entry.label}
                        options={(related[index]?.data ?? []).map((row) => ({
                          value: String(row.id),
                          label: row.name,
                        }))}
                      />
                    ))}

                    <OptionField
                      control={form.control}
                      name='nature_type'
                      label='Nature'
                      options={NATURE_TYPES}
                    />
                    <OptionField
                      control={form.control}
                      name='transparency'
                      label='Transparency'
                      options={TRANSPARENCIES}
                    />
                    <OptionField
                      control={form.control}
                      name='treatment'
                      label='Treatment'
                      options={TREATMENTS}
                    />
                    <OptionField
                      control={form.control}
                      name='optic_character'
                      label='Optic character'
                      options={OPTIC_CHARACTERS}
                    />
                  </div>
                </section>

                <Separator />

                <section className='space-y-4'>
                  <h3 className='text-sm font-medium'>Measurements</h3>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <TextField
                      control={form.control}
                      name='dimensions'
                      label='Dimensions'
                      placeholder='e.g. 8.2 × 6.1 × 4.0 mm'
                    />
                    <TextField
                      control={form.control}
                      name='refractive_index'
                      label='Refractive index'
                      placeholder='e.g. 1.762 – 1.770'
                    />
                    <FormField
                      control={form.control}
                      name='specific_gravity'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific gravity</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.001'
                              min='0'
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='is_polished'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center gap-3 rounded-md border p-3'>
                          <FormControl>
                            <Checkbox
                              checked={Boolean(field.value)}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className='!mt-0'>
                            Stone is polished
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <Separator />

                <section className='space-y-4'>
                  <h3 className='text-sm font-medium'>Conclusion</h3>
                  <FormField
                    control={form.control}
                    name='conclusion'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='sr-only'>Conclusion</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder='What the stone is, in the words the certificate will carry.'
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>
              </fieldset>
            </form>
          </Form>

          {/* Instruments save immediately through their own endpoint, so the
            panel sits outside the report form rather than inside it. */}
          {currentRow && (
            <>
              <Separator className='my-6' />
              <div className='px-1'>
                <InstrumentsPanel
                  reportId={currentRow.id}
                  readOnly={isLocked}
                />
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          {readOnly ? (
            <ViewFooterActions
              actions={actions}
              primary={
                onRequestEdit &&
                !currentRow?.is_finalized && (
                  <Can permission={perm('identification-reports', 'change')}>
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
                form='report-form'
                disabled={isLocked || mutation.isPending}
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

type FieldProps = {
  // Loosely typed on purpose: these helpers are local to this file.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  name: string
  label: string
}

/** A select whose blank choice means "not recorded", which is always allowed. */
function OptionField({
  control,
  name,
  label,
  options,
}: FieldProps & { options: EnumOption[] }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value ? String(field.value) : NONE}
            onValueChange={(value) =>
              field.onChange(value === NONE ? '' : value)
            }
          >
            <FormControl>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Not recorded' />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NONE}>Not recorded</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function TextField({
  control,
  name,
  label,
  placeholder,
}: FieldProps & { placeholder?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
