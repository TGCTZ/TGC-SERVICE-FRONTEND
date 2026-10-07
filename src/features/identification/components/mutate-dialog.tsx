import { useEffect, useState } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm, useWatch } from 'react-hook-form'
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { fieldErrors, serverMessageOr } from '@/lib/handle-server-error'
import { PERMISSIONS, perm, type PermissionResource } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { zodResolver } from '@/lib/zod-resolver'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { DialogBody } from '@/components/dialog-body'
import { StatusBadge } from '@/components/status-badge'
import {
  createOrGetLookupRow,
  lookupOptionsQuery,
  searchLookupOptions,
} from '@/features/lookups/data/api'
import { WEIGHT_UNITS } from '@/features/stones/data/enums'
import { createReport, findingsWorklistQuery, updateReport } from '../data/api'
import {
  NATURE_TYPES,
  OPTIC_CHARACTERS,
  TRANSPARENCIES,
  type EnumOption,
} from '../data/enums'
import { FINALIZE_REQUIRED_NAMES } from '../data/finalize-rules'
import { type IdentificationReport } from '../data/schema'
import { InstrumentsPanel } from './instruments-panel'
import { StonePhotoPanel } from './stone-photo-panel'

/** Radix forbids an empty-string SelectItem value, so "not recorded" needs one. */
const NONE = 'none'

/** The lab's hue progression; non-hue colors follow the circular sequence. */
const COLOR_HUE_ORDER = [
  'Violet',
  'Bluish violet',
  'Violetish blue',
  'Blue',
  'Very slightly greenish blue',
  'Greenish blue',
  'Very strongly greenish blue',
  'Green blue or blue green',
  'Strongly bluish green',
  'Slightly bluish green',
  'Very slightly bluish green',
  'Green',
  'Slightly yellowish green',
  'Yellowish green',
  'Strongly yellowish green',
  'Yellow green or green yellow',
  'Greenish yellow',
  'Yellow',
  'Orange yellow',
  'Yellowish orange',
  'Orange',
  'Reddish orange',
  'Red orange or orange red',
  'Orangy red',
  'Red',
  'Slightly purplish red',
  'Strongly purplish red',
  'Purple red or red purple',
  'Reddish purple',
  'Purple',
  'Bluish purple',
  'Colorless',
  'Brown',
  'Black',
  'Pink',
  'Grey',
] as const
const COLOR_HUE_RANK = new Map<string, number>(
  COLOR_HUE_ORDER.map((name, index) => [name, index])
)

/** Approximate display swatches for the lab's named color choices. */
const COLOR_SWATCHES: Record<string, string> = {
  Colorless: '#f8fafc',
  Black: '#171717',
  Grey: '#808080',
  Violet: '#7c3aed',
  'Bluish violet': '#6045cd',
  Purple: '#9333ea',
  'Bluish purple': '#7c4dff',
  'Reddish purple': '#ad2a76',
  'Orangy red': '#ed4e33',
  Red: '#dc2626',
  'Slightly purplish red': '#ca315c',
  'Strongly purplish red': '#b42363',
  'Purple red or red purple': '#bd245b',
  Pink: '#ec4899',
  'Greenish yellow': '#b4c63b',
  Yellow: '#f2d22b',
  'Orange yellow': '#f5b52e',
  'Yellowish orange': '#efa32c',
  Orange: '#ed7d24',
  'Reddish orange': '#e95b2d',
  'Red orange or orange red': '#e94b26',
  'Strongly bluish green': '#008b76',
  'Slightly bluish green': '#3a9b63',
  'Very slightly bluish green': '#49a65d',
  Green: '#2e8b45',
  'Slightly yellowish green': '#6aa543',
  'Yellowish green': '#85ac33',
  'Strongly yellowish green': '#9faf23',
  'Yellow green or green yellow': '#91b72d',
  'Violetish blue': '#4f5fd0',
  Blue: '#2563eb',
  'Very slightly greenish blue': '#318ab7',
  'Greenish blue': '#219b9b',
  'Very strongly greenish blue': '#178c86',
  'Green blue or blue green': '#189e91',
  Brown: '#8b5a2b',
}

function ColorSwatch({ name }: { name: string }) {
  return (
    <span
      aria-hidden='true'
      className='h-5 w-3 shrink-0 rounded-sm border border-black/15 dark:border-white/20'
      style={{ backgroundColor: COLOR_SWATCHES[name] ?? '#94a3b8' }}
    />
  )
}

/** The reference tables the classification section draws on. */
const RELATED: {
  name: string
  label: string
  resource: PermissionResource
  searchable?: boolean
  creatable?: boolean
}[] = [
  {
    name: 'stone_type',
    label: 'Stone type',
    resource: 'stone-types',
    searchable: true,
    creatable: true,
  },
  {
    name: 'species',
    label: 'Specie / Group',
    resource: 'species',
    searchable: true,
    creatable: true,
  },
  {
    name: 'variety',
    label: 'Variety',
    resource: 'varieties',
    searchable: true,
    creatable: true,
  },
  {
    name: 'color',
    label: 'Colour',
    resource: 'colors',
    searchable: true,
  },
  {
    name: 'origin',
    label: 'Origin',
    resource: 'origins',
    searchable: true,
    creatable: true,
  },
  {
    name: 'shape_cut',
    label: 'Shape / cut',
    resource: 'shape-cuts',
    searchable: true,
    creatable: true,
  },
  {
    name: 'treatment',
    label: 'Treatment',
    resource: 'treatments',
    searchable: true,
    creatable: true,
  },
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

  stone_type: z.string().optional(),
  species: z.string().optional(),
  variety: z.string().optional(),
  color: z.string().optional(),
  origin: z.string().optional(),
  shape_cut: z.string().optional(),

  nature_type: z.string().optional(),
  transparency: z.string().optional(),
  treatment: z.string().optional(),
  optic_character: z.string().optional(),

  refractive_index: z.string().optional(),
  specific_gravity: z.string().optional(),
  weight: z.string().optional(),
  weight_unit: z.string().default('carat'),
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
  /**
   * Preselected stone, when the dialog is opened from the findings queue.
   *
   * Only meaningful while creating; the select still renders, so the choice
   * stays visible and changeable.
   */
  initialStone?: number
}

function formatStoneReference(
  orderReference: string | null | undefined,
  stoneLabel: string | null | undefined
) {
  return [orderReference, stoneLabel].filter(Boolean).join('-')
}

export function ReportMutateDialog({
  open,
  onOpenChange,
  currentRow,
  initialStone,
}: ReportMutateDialogProps) {
  /**
   * The report the server returned from a create, kept so the dialog can carry
   * on as if it had been opened for editing.
   *
   * Instruments post to `{report}/instruments-used/`, so they have nowhere to
   * go until the report exists. Closing on create forced the gemmologist to
   * reopen the row just to record what they had measured; holding the dialog
   * open keeps one sitting at the bench as one sitting in the UI.
   */
  const [createdRow, setCreatedRow] = useState<IdentificationReport | null>(
    null
  )

  // Forget the created report when the dialog closes. Without this, opening
  // "Record findings" a second time would still be holding the first report:
  // the parent keys this component on `create` for every create, so it is not
  // remounted between them.
  //
  // Adjusted during render rather than in an effect - React's own guidance for
  // resetting state when a prop changes, and it avoids the cascading extra
  // render an effect would cost.
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (!open) setCreatedRow(null)
  }

  /** The report this dialog is working on, however it got one. */
  const row = currentRow ?? createdRow
  const isEdit = Boolean(row)
  const queryClient = useQueryClient()

  // One hook for all classification lookups; a hook cannot run inside `.map()`.
  const related = useQueries({
    queries: RELATED.map((entry) => ({
      ...lookupOptionsQuery(entry.resource),
      enabled: open,
    })),
  })

  // Only needed while creating: the endpoint encodes "paid, not yet finalized".
  const { data: worklist = [] } = useQuery({
    ...findingsWorklistQuery(),
    enabled: open && !isEdit,
  })

  // The queue deliberately includes stones whose draft is still open, since
  // those are still work in progress - but a stone carries at most one report,
  // so offering one here would post a create the server rejects as a duplicate.
  // Those stones are reached by editing their draft instead.
  const selectable = worklist.filter((stone) => !stone.report_detail)

  // A finalized report is locked by the service — `is_finalized` is one-way —
  // so the form stays locked even for someone who may otherwise edit.
  const permissions = useAuthStore(
    (state) => state.auth.user?.permissions ?? []
  )
  const isLocked = Boolean(
    row?.is_finalized && !permissions.includes(PERMISSIONS.editFinalizedReport)
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { stone: '', is_polished: false },
  })

  /**
   * The stone the photograph panel writes to, watched rather than read once.
   *
   * Watching is what lets the panel appear the moment someone picks a stone
   * while creating, instead of waiting for a report that the photograph never
   * needed - it is the stone that carries the image.
   */
  const watchedStone = useWatch({ control: form.control, name: 'stone' })
  const watchedSpecies = useWatch({ control: form.control, name: 'species' })
  const selectedStone = watchedStone ? Number(watchedStone) : null
  const selectedIntakeStone = selectable.find(
    (stone) => stone.id === selectedStone
  )
  const selectedCategory = row
    ? row.stone_category_detail?.id
    : selectedIntakeStone?.stone_category
  const selectedCategoryName = row
    ? row.stone_category_detail?.name
    : selectedIntakeStone?.stone_category_detail?.name

  useEffect(() => {
    if (!open) return

    form.reset({
      stone: row ? String(row.stone) : initialStone ? String(initialStone) : '',
      stone_type: row?.stone_type_detail
        ? String(row.stone_type_detail.id)
        : '',
      species: row?.species ? String(row.species) : '',
      variety: row?.variety ? String(row.variety) : '',
      color: row?.color ? String(row.color) : '',
      origin: row?.origin ? String(row.origin) : '',
      shape_cut: row?.shape_cut ? String(row.shape_cut) : '',
      nature_type: row?.nature_type ?? '',
      transparency: row?.transparency ?? '',
      treatment: row?.treatment ? String(row.treatment) : '',
      optic_character: row?.optic_character ?? '',
      refractive_index: row?.refractive_index ?? '',
      specific_gravity: row?.specific_gravity ?? '',
      weight: row?.stone_weight ?? '',
      weight_unit: row?.stone_weight_unit ?? 'carat',
      is_polished: row?.is_polished ?? false,
      conclusion: row?.conclusion ?? '',
    })
  }, [open, row, initialStone, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        stone_type: idOrNull(values.stone_type),
        species: idOrNull(values.species),
        variety: idOrNull(values.variety),
        color: idOrNull(values.color),
        origin: idOrNull(values.origin),
        shape_cut: idOrNull(values.shape_cut),

        // Enums are blank strings when unrecorded, not null: the columns are
        // `blank=True, default=""` rather than nullable.
        nature_type: values.nature_type ?? '',
        transparency: values.transparency ?? '',
        treatment: idOrNull(values.treatment),
        optic_character: values.optic_character ?? '',

        refractive_index: values.refractive_index ?? '',
        specific_gravity: values.specific_gravity?.trim()
          ? values.specific_gravity.trim()
          : null,
        // Applied to the stone by the service, not stored on the report.
        weight: values.weight?.trim() ? values.weight.trim() : null,
        weight_unit: values.weight_unit,
        is_polished: values.is_polished,
        conclusion: values.conclusion ?? '',
      }

      // `stone` rides along on the update too: it is a required field on the
      // serializer, so a PUT without it is rejected before the service ever
      // sees the findings. The service then discards it — a report cannot move
      // between stones — but the request must still carry it.
      const stone = Number(values.stone)

      return row
        ? updateReport(row.id, { ...payload, stone })
        : createReport({ ...payload, stone })
    },
    onSuccess: async (report) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['identification-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['worklist'] }),
        queryClient.invalidateQueries({ queryKey: ['workflow-feed'] }),
      ])

      if (isEdit) {
        toast.success('Findings saved')
        onOpenChange(false)
        return
      }

      // Deliberately left open. The report now exists, so adopting it turns
      // this into an edit and the instruments panel below becomes usable -
      // which is the whole reason a create closed too early before.
      setCreatedRow(report)
      toast.success(
        `Opened ${report.report_number} - add the photograph and instruments below`
      )
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
            {isEdit ? `Edit ${row?.report_number}` : 'Record findings'}
            {row?.is_finalized && (
              <StatusBadge tone='success'>Finalized</StatusBadge>
            )}
          </DialogTitle>
          <DialogDescription>
            {row
              ? `Stone ${formatStoneReference(row.order_reference, row.stone_label)}`
              : 'Select a paid stone awaiting findings.'}
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
                              value={formatStoneReference(
                                row?.order_reference,
                                row?.stone_label
                              )}
                            />
                          </FormControl>
                        ) : (
                          <Select
                            value={field.value || undefined}
                            onValueChange={(value) => {
                              field.onChange(value)
                              form.setValue('stone_type', '')
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Select a stone with no findings yet' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectable.map((stone) => (
                                <SelectItem
                                  key={stone.id}
                                  value={String(stone.id)}
                                >
                                  {formatStoneReference(
                                    stone.order_reference,
                                    stone.label
                                  )}{' '}
                                  ·{' '}
                                  {stone.stone_category_detail?.name ??
                                    'Uncategorized'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {isEdit ? (
                          <FormDescription>
                            A report stays linked to its stone.
                          </FormDescription>
                        ) : (
                          worklist.length === 0 && (
                            <FormDescription>
                              Paid stones appear here when ready for findings.
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
                    {RELATED.map((entry, index) => {
                      const lookupRows = related[index]?.data ?? []
                      const selectedSpecies = watchedSpecies
                        ? Number(watchedSpecies)
                        : null
                      const options = lookupRows
                        .filter(
                          (lookupRow) =>
                            (entry.name !== 'variety' ||
                              lookupRow.species === selectedSpecies) &&
                            (entry.name !== 'stone_type' ||
                              lookupRow.category === selectedCategory)
                        )
                        .map((row) => ({
                          value: String(row.id),
                          label: row.name,
                        }))

                      if (entry.name === 'color') {
                        options.sort(
                          (left, right) =>
                            (COLOR_HUE_RANK.get(left.label) ?? Infinity) -
                              (COLOR_HUE_RANK.get(right.label) ?? Infinity) ||
                            left.label.localeCompare(right.label)
                        )
                      }

                      return (
                        <OptionField
                          key={entry.name}
                          control={form.control}
                          name={entry.name}
                          label={entry.label}
                          labelSuffix={
                            entry.name === 'stone_type' && selectedCategoryName
                              ? `(Category: ${selectedCategoryName})`
                              : undefined
                          }
                          options={options}
                          searchable={entry.searchable}
                          resource={entry.resource}
                          creatable={entry.creatable}
                          searchFilters={
                            entry.name === 'stone_type' && selectedCategory
                              ? { category: selectedCategory }
                              : undefined
                          }
                          disabled={
                            entry.name === 'stone_type' && !selectedCategory
                          }
                          disabledMessage={
                            entry.name === 'stone_type' && !selectedCategory
                              ? 'Select a stone first to load types in its category.'
                              : undefined
                          }
                          createExtra={
                            entry.name === 'variety'
                              ? { species: selectedSpecies }
                              : entry.name === 'stone_type' && selectedCategory
                                ? { category: selectedCategory }
                                : undefined
                          }
                          onSelection={
                            entry.name === 'species'
                              ? (value) => {
                                  if (value !== form.getValues('species')) {
                                    form.setValue('variety', '')
                                  }
                                }
                              : undefined
                          }
                          loading={related[index]?.isPending ?? false}
                          loadError={related[index]?.isError ?? false}
                        />
                      )
                    })}

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
                    {/* Weight is the one measurement stored on the stone rather
                        than the report — the certificate snapshots the stone.
                        The API takes it here and hands it on. */}
                    <div className='grid grid-cols-[1fr_8rem] gap-3'>
                      <FormField
                        control={form.control}
                        name='weight'
                        render={({ field }) => (
                          <FormItem>
                            <FieldLabel label='Weight' />
                            <FormControl
                              {...unansweredProps('weight', field.value)}
                            >
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
                        name='weight_unit'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className='w-full'>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {WEIGHT_UNITS.map((unit) => (
                                  <SelectItem
                                    key={unit.value}
                                    value={unit.value}
                                  >
                                    {unit.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                  <h3 className='text-sm font-medium'>Comments</h3>
                  <FormField
                    control={form.control}
                    name='conclusion'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='sr-only'>Comments</FormLabel>
                        <FormControl
                          {...unansweredProps('conclusion', field.value)}
                        >
                          <Textarea
                            rows={4}
                            placeholder='Add comments about the stone.'
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

          {/* The photograph and the instruments both save immediately through
            their own endpoints, so these panels sit outside the report form
            rather than inside it.

            They are gated separately because they depend on different things.
            The photograph writes to the *stone*, so it needs only a chosen
            stone and can be taken before any report exists. The instruments
            post to the report's own sub-resource, so they need a saved report
            - which is why a create adopts what the server returns rather than
            closing. */}
          {selectedStone && (
            <>
              <Separator className='my-6' />
              <div className='px-1'>
                <StonePhotoPanel stoneId={selectedStone} readOnly={isLocked} />
              </div>
            </>
          )}

          {row && (
            <>
              <Separator className='my-6' />
              <div className='px-1'>
                <InstrumentsPanel reportId={row.id} readOnly={isLocked} />
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {/* Once a report exists the work is already saved, so offering to
              "Cancel" would misdescribe what this button does. */}
            {row ? 'Close' : 'Cancel'}
          </Button>
          <Button
            type='submit'
            form='report-form'
            disabled={isLocked || mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
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
/** Render a concise label for a findings field. */
/**
 * `aria-invalid` for an unanswered field, or nothing at all.
 *
 * Spread rather than passed as a value, because `FormControl` sets
 * `aria-invalid={!!error}` and then spreads its own props over it - so passing
 * an explicit `undefined` would *clear* a genuine validation error's red state
 * on a field that has been answered. Omitting the key entirely lets the real
 * error show through.
 */
function unansweredProps(name: string, value: unknown) {
  return needsAnswer(name, value) ? { 'aria-invalid': true as const } : {}
}

/**
 * Whether a field finalize insists on is still unanswered.
 *
 * Drives the red outline. Note what it is *not*: the form saves happily
 * without any of these, so this is not "you entered something wrong" - it is
 * "this one is still outstanding". Tying it to emptiness rather than to a
 * submit attempt means the mark clears the moment the finding is recorded,
 * which is the feedback a gemmologist working down the form actually wants.
 */
function needsAnswer(name: string, value: unknown): boolean {
  if (!FINALIZE_REQUIRED_NAMES.has(name)) return false
  return !String(value ?? '').trim()
}

function FieldLabel({ label, suffix }: { label: string; suffix?: string }) {
  return (
    <FormLabel>
      {label}
      {suffix && <span className='ms-1 font-normal'>{suffix}</span>}
    </FormLabel>
  )
}

function OptionField({
  control,
  name,
  label,
  labelSuffix,
  options,
  searchable = false,
  resource,
  creatable = false,
  createExtra,
  searchFilters,
  disabled = false,
  disabledMessage,
  onSelection,
  loading = false,
  loadError = false,
}: FieldProps & {
  options: EnumOption[]
  labelSuffix?: string
  searchable?: boolean
  resource?: PermissionResource
  creatable?: boolean
  createExtra?: Record<string, unknown>
  searchFilters?: Record<string, number>
  disabled?: boolean
  disabledMessage?: string
  onSelection?: (value: string) => void
  loading?: boolean
  loadError?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const queryClient = useQueryClient()
  const permissions = useAuthStore(
    (state) => state.auth.user?.permissions ?? []
  )
  const canCreate = Boolean(
    creatable && resource && permissions.includes(perm(resource, 'add'))
  )
  const trimmedSearch = searchTerm.trim()
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(trimmedSearch),
      200
    )
    return () => window.clearTimeout(timeout)
  }, [trimmedSearch])
  const searchResults = useQuery({
    queryKey: [
      'lookup-search',
      resource,
      name,
      debouncedSearch,
      createExtra,
      searchFilters,
    ],
    queryFn: () =>
      searchLookupOptions(
        resource!,
        debouncedSearch,
        searchFilters ??
          (name === 'variety' && createExtra?.species
            ? { species: Number(createExtra.species) }
            : {})
      ),
    enabled: Boolean(
      searchable && open && resource && debouncedSearch.length >= 2
    ),
    staleTime: 30_000,
  })
  const visibleOptions = [
    ...options,
    ...(searchResults.data ?? []).map((option) => ({
      value: String(option.id),
      label: option.name,
    })),
  ].filter(
    (option, index, all) =>
      all.findIndex((candidate) => candidate.value === option.value) === index
  )
  const hasExactOption = visibleOptions.some(
    (option) =>
      option.label.trim().toLocaleLowerCase() ===
      trimmedSearch.toLocaleLowerCase()
  )
  const canCreateNow =
    canCreate &&
    Boolean(trimmedSearch) &&
    !hasExactOption &&
    (name !== 'variety' || Boolean(createExtra?.species))

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = options.find(
          (option) => option.value === String(field.value ?? '')
        )

        return (
          <FormItem>
            <FieldLabel label={label} suffix={labelSuffix} />
            {searchable ? (
              <Popover
                open={open}
                onOpenChange={(nextOpen) => {
                  setOpen(nextOpen)
                  if (!nextOpen) setSearchTerm('')
                }}
                modal
              >
                <PopoverTrigger asChild>
                  <FormControl {...unansweredProps(name, field.value)}>
                    <Button
                      type='button'
                      disabled={disabled}
                      variant='outline'
                      role='combobox'
                      aria-expanded={open}
                      aria-controls={`${name}-options`}
                      className={cn(
                        'w-full justify-between font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <span className='flex min-w-0 items-center gap-2'>
                        {name === 'color' && selected && (
                          <ColorSwatch name={selected.label} />
                        )}
                        <span className='truncate'>
                          {selected?.label ?? 'Not recorded'}
                        </span>
                      </span>
                      <ChevronsUpDown
                        className='opacity-50'
                        aria-hidden='true'
                      />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  align='start'
                  className='w-(--radix-popover-trigger-width) min-w-60 p-0'
                >
                  <Command>
                    <CommandInput
                      placeholder={
                        creatable
                          ? `Search or add ${label.toLowerCase()}…`
                          : `Search ${label.toLowerCase()}…`
                      }
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandList id={`${name}-options`}>
                      <CommandEmpty>
                        No matching {label.toLowerCase()}.
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value='Not recorded'
                          onSelect={() => {
                            onSelection?.('')
                            field.onChange('')
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'size-4',
                              !field.value ? 'opacity-100' : 'opacity-0'
                            )}
                            aria-hidden
                          />
                          <span>Not recorded</span>
                        </CommandItem>
                        {visibleOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              onSelection?.(option.value)
                              field.onChange(option.value)
                              setOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'size-4',
                                option.value === String(field.value ?? '')
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                              aria-hidden
                            />
                            {name === 'color' && (
                              <ColorSwatch name={option.label} />
                            )}
                            <span>{option.label}</span>
                          </CommandItem>
                        ))}
                        {canCreateNow && resource && (
                          <CommandItem
                            value={`Create ${trimmedSearch}`}
                            onSelect={async () => {
                              try {
                                const created = await createOrGetLookupRow(
                                  resource,
                                  trimmedSearch,
                                  createExtra
                                )
                                queryClient.setQueryData(
                                  ['lookup', resource],
                                  (
                                    current: { id: number; name: string }[] = []
                                  ) =>
                                    current.some(
                                      (item) => item.id === created.id
                                    )
                                      ? current
                                      : [...current, created]
                                )
                                await queryClient.invalidateQueries({
                                  queryKey: ['lookup', resource],
                                })
                                field.onChange(String(created.id))
                                setSearchTerm('')
                                setOpen(false)
                              } catch {
                                toast.error(
                                  `Could not add this ${label.toLowerCase()}.`
                                )
                              }
                            }}
                          >
                            <span className='text-muted-foreground'>
                              Add “{trimmedSearch}”
                            </span>
                          </CommandItem>
                        )}
                        {name === 'variety' && !createExtra?.species && (
                          <p className='px-2 py-1.5 text-sm text-muted-foreground'>
                            Select a Specie / Group before adding a variety.
                          </p>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Select
                value={field.value ? String(field.value) : NONE}
                onValueChange={(value) =>
                  field.onChange(value === NONE ? '' : value)
                }
              >
                <FormControl {...unansweredProps(name, field.value)}>
                  <SelectTrigger className='w-full' disabled={disabled}>
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
            )}
            {loading && <FormDescription>Loading choices…</FormDescription>}
            {disabledMessage && (
              <FormDescription>{disabledMessage}</FormDescription>
            )}
            {loadError && (
              <p className='text-sm text-destructive' role='alert'>
                Could not load choices. Close and reopen this dialog to retry.
              </p>
            )}
            <FormMessage />
          </FormItem>
        )
      }}
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
          <FieldLabel label={label} />
          <FormControl {...unansweredProps(name, field.value)}>
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
