import { Square, SquareCheck } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { type RowAction } from '@/components/data-table'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { WEIGHT_UNIT_SYMBOLS } from '@/features/stones/data/enums'
import { type Certificate } from '../data/schema'
import { CertificateStatusBadge } from './status-badge'

type CertificateViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificate: Certificate
  actions?: RowAction[]
}

/**
 * Everything on one certificate; the footer carries its actions.
 *
 * The four snapshot fields are shown as the document\'s own words rather than
 * joined to the live records — that is what a certificate is.
 */
export function CertificateViewDialog({
  open,
  onOpenChange,
  certificate,
  actions = [],
}: CertificateViewDialogProps) {
  // The unit is snapshotted alongside the number: a weight without its unit
  // states nothing, and reading the stone's live unit could rewrite the
  // document after the fact.
  const weightUnit =
    WEIGHT_UNIT_SYMBOLS[certificate.weight_unit_snapshot ?? ''] ??
    certificate.weight_unit_snapshot ??
    ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            {certificate.certificate_number}
            <CertificateStatusBadge status={certificate.status} />
          </DialogTitle>
          <DialogDescription>
            {certificate.order_reference} · {certificate.stone_label} ·{' '}
            {certificate.customer_name}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          {/* The photograph frozen at issue — replacing the stone's photo
              afterwards never changes what this document shows. */}
          {certificate.photo_snapshot && (
            <div className='flex justify-center rounded-md border p-2'>
              <img
                src={certificate.photo_snapshot}
                alt='The stone, as certified'
                className='max-h-48 rounded object-contain'
              />
            </div>
          )}

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>What the document says</h3>
            <DefinitionList
              items={[
                { label: 'Stone type', value: certificate.stone_type_snapshot },
                {
                  label: 'Weight',
                  value: `${certificate.weight_snapshot} ${weightUnit}`,
                },
                { label: 'Species', value: certificate.species_snapshot },
                { label: 'Variety', value: certificate.variety_snapshot },
                { label: 'Colour', value: certificate.color_snapshot },
                { label: 'Shape / cut', value: certificate.shape_cut_snapshot },
                { label: 'Origin', value: certificate.origin_snapshot },
                { label: 'Nature', value: certificate.nature_type_snapshot },
                { label: 'Treatment', value: certificate.treatment_snapshot },
                {
                  label: 'Transparency',
                  value: certificate.transparency_snapshot,
                },
                {
                  label: 'Optic character',
                  value: certificate.optic_character_snapshot,
                },
                {
                  label: 'Refractive index',
                  value: certificate.refractive_index_snapshot,
                },
                {
                  label: 'Specific gravity',
                  value: certificate.specific_gravity_snapshot,
                },
                { label: 'Gemmologist 1', value: certificate.gemmologist },
                { label: 'Gemmologist 2', value: certificate.gemmologist_two },
                {
                  label: 'From report',
                  value:
                    certificate.report_number_snapshot ||
                    certificate.report_number,
                },
                {
                  label: 'Comments',
                  value: certificate.comments_snapshot,
                  wide: true,
                },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Instruments used</h3>
            {certificate.instrument_checklist.length === 0 ? (
              <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
                No instruments recorded.
              </p>
            ) : (
              <ul className='divide-y rounded-md border'>
                {certificate.instrument_checklist.map((instrument) => (
                  <li
                    key={instrument.name}
                    className='flex items-center gap-2 p-3'
                  >
                    {instrument.used ? (
                      <SquareCheck className='size-4 text-primary' />
                    ) : (
                      <Square className='size-4 text-muted-foreground' />
                    )}
                    <span
                      className={
                        instrument.used
                          ? 'text-sm font-medium'
                          : 'text-sm text-muted-foreground'
                      }
                    >
                      {instrument.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Issued</h3>
            <DefinitionList
              items={[
                { label: 'By', value: certificate.issued_by_label },
                { label: 'On', value: formatDateTime(certificate.issued_at) },
              ]}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <ViewFooterActions actions={actions} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
