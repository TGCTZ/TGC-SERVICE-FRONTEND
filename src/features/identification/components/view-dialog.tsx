import { Pencil } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { perm } from '@/lib/permissions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { WEIGHT_UNIT_SYMBOLS } from '@/features/stones/data/enums'
import {
  NATURE_TYPES,
  OPTIC_CHARACTERS,
  TRANSPARENCIES,
  TREATMENTS,
  type EnumOption,
} from '../data/enums'
import { type IdentificationReport } from '../data/schema'

type ReportViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: IdentificationReport
  /** Switches the view into the edit form, when the report is still open. */
  onRequestEdit?: () => void
  actions?: RowAction[]
}

/**
 * Turn a stored enum code into the label the printed report uses.
 *
 * Returns null for an unrecorded finding rather than the raw code, so an
 * optional test nobody ran shows as an em dash — which is the honest reading,
 * since a stone can defeat one test while answering another.
 */
function enumLabel(options: EnumOption[], value: string): string | null {
  if (!value) return null
  return options.find((option) => option.value === value)?.label ?? value
}

/** The stone's weight as measured at the bench, or null if never taken. */
function formatStoneWeight(report: IdentificationReport): string | null {
  if (!report.stone_weight) return null
  const symbol =
    WEIGHT_UNIT_SYMBOLS[report.stone_weight_unit] ?? report.stone_weight_unit
  return `${report.stone_weight} ${symbol}`
}

/**
 * A gemmologist's findings for one stone, as a record.
 *
 * A definition list rather than the mutate form with `isLocked` on every field.
 * A finalized report is genuinely immutable — `is_finalized` is one-way — so
 * the form was never going to accept a change, and rendering one implied
 * otherwise. It also let a blank optional finding look like an empty input
 * waiting to be filled in, when it means the test was not run.
 */
export function ReportViewDialog({
  open,
  onOpenChange,
  report,
  onRequestEdit,
  actions = [],
}: ReportViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex flex-wrap items-center gap-2'>
            {report.report_number}
            <Badge variant={report.is_finalized ? 'default' : 'secondary'}>
              {report.is_finalized ? 'Finalized' : 'Draft'}
            </Badge>
            {report.deleted_at && <Badge variant='destructive'>Deleted</Badge>}
          </DialogTitle>
          <DialogDescription>
            {report.stone_label ?? 'Unknown stone'}
            {report.order_reference ? ` · ${report.order_reference}` : ''}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          {/* The conclusion leads: it is the sentence the certificate carries,
              and the reason anyone opens a finished report. */}
          <div className='space-y-2 rounded-md border p-3'>
            <h3 className='text-sm font-medium'>Conclusion</h3>
            <p className='text-sm'>
              {report.conclusion || (
                <span className='text-muted-foreground'>
                  No conclusion recorded yet.
                </span>
              )}
            </p>
          </div>

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Identification</h3>
            <DefinitionList
              items={[
                {
                  label: 'Species',
                  value: report.species_detail?.name ?? null,
                },
                {
                  label: 'Variety',
                  value: report.variety_detail?.name ?? null,
                },
                { label: 'Origin', value: report.origin_detail?.name ?? null },
                { label: 'Colour', value: report.color_detail?.name ?? null },
                {
                  label: 'Shape / cut',
                  value: report.shape_cut_detail?.name ?? null,
                },
                {
                  label: 'Nature',
                  value: enumLabel(NATURE_TYPES, report.nature_type),
                },
                {
                  label: 'Transparency',
                  value: enumLabel(TRANSPARENCIES, report.transparency),
                },
                {
                  label: 'Treatment',
                  value: enumLabel(TREATMENTS, report.treatment),
                },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Measurements</h3>
            <DefinitionList
              items={[
                { label: 'Weight', value: formatStoneWeight(report) },
                { label: 'Dimensions', value: report.dimensions },
                { label: 'Refractive index', value: report.refractive_index },
                { label: 'Specific gravity', value: report.specific_gravity },
                {
                  label: 'Optic character',
                  value: enumLabel(OPTIC_CHARACTERS, report.optic_character),
                },
                { label: 'Polished', value: report.is_polished ? 'Yes' : 'No' },
              ]}
            />
          </div>

          <Separator />

          {/* Each instrument is a sub-resource written at the bench as the
              reading is taken; here they are simply what the report rests on. */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Instruments used</h3>

            {report.instruments_used.length === 0 ? (
              <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
                No instruments recorded.
              </p>
            ) : (
              <ul className='divide-y rounded-md border'>
                {report.instruments_used.map((used) => (
                  <li
                    key={used.id}
                    className='flex flex-wrap items-center justify-between gap-2 p-3'
                  >
                    <span className='text-sm font-medium'>
                      {used.instrument_detail?.name ?? 'Instrument'}
                    </span>
                    <span className='text-sm text-muted-foreground'>
                      {used.reading || 'No reading'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Record</h3>
            <DefinitionList
              items={[
                { label: 'Report number', value: report.report_number },
                { label: 'Stone', value: report.stone_label },
                { label: 'Order', value: report.order_reference },
                {
                  label: 'Identified by',
                  value: report.identified_by_label,
                },
                {
                  label: 'Identified at',
                  value: formatDateTime(report.identified_at),
                },
                {
                  label: 'Last updated',
                  value: formatDateTime(report.updated_at),
                },
              ]}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <ViewFooterActions
            actions={actions}
            primary={
              // A finalized report accepts no writes, so Edit is withdrawn
              // rather than offered and then refused by the API.
              onRequestEdit &&
              !report.is_finalized && (
                <Can permission={perm('identification-reports', 'change')}>
                  <Button onClick={onRequestEdit}>
                    <Pencil className='me-1 size-4' />
                    Edit
                  </Button>
                </Can>
              )
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
