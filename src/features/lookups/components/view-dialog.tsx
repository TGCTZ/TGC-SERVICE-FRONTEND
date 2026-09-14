import { type ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { formatDateTime, formatMoney } from '@/lib/format'
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
import { BoolBadge } from '@/components/bool-badge'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import {
  lookupFieldLabel,
  type LookupConfig,
  type LookupField,
  type LookupRow,
} from '../data/config'

type LookupViewDialogProps = {
  config: LookupConfig
  row: LookupRow
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Switches the view into the edit form, when the user may edit. */
  onRequestEdit?: () => void
  actions?: RowAction[]
}

/**
 * Render one extra field's value the way its type reads best.
 *
 * Deliberately the same three special cases the table column makes — a colour
 * needs its swatch, money needs its formatting, and a `select` stores a code
 * rather than the label a person recognises — so a record reads identically
 * whether it is met in the list or in this dialog.
 *
 * Returns null for an absent value, letting `DefinitionList` render its em
 * dash rather than each caller inventing its own placeholder.
 */
function renderFieldValue(
  field: LookupField,
  record: Record<string, unknown>
): ReactNode {
  const value = record[field.key]
  if (value === null || value === undefined || value === '') return null

  if (field.type === 'color') {
    return (
      <span className='flex items-center gap-2'>
        <span
          className='size-4 rounded-full border'
          style={{ backgroundColor: String(value) }}
        />
        {String(value)}
      </span>
    )
  }

  // Decimals cross the wire as strings, to survive the round trip.
  if (field.type === 'money') return formatMoney(Number(value))

  if (field.type === 'url') {
    return (
      <a
        href={String(value)}
        target='_blank'
        rel='noreferrer'
        className='underline underline-offset-4'
      >
        {String(value)}
      </a>
    )
  }

  return lookupFieldLabel(field, record) ?? String(value)
}

/**
 * Everything known about one lookup row.
 *
 * Config-driven like the form it replaces, so a new lookup still needs only a
 * config entry. A definition list rather than the form with a disabled
 * fieldset: a greyed-out input reads as a permission refusal, when in fact
 * whoever may manage reference data may edit this — they simply are not
 * editing it yet.
 */
export function LookupViewDialog({
  config,
  row,
  open,
  onOpenChange,
  onRequestEdit,
  actions = [],
}: LookupViewDialogProps) {
  const record = row as Record<string, unknown>

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex flex-wrap items-center gap-2'>
            {row.name}
            <BoolBadge value={row.is_active} />
            {row.deleted_at && <Badge variant='destructive'>Deleted</Badge>}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Details</h3>
            <DefinitionList
              items={[
                { label: 'Name', value: row.name },
                ...config.extraFields.map((field) => ({
                  label: field.label,
                  value: renderFieldValue(field, record),
                })),
                {
                  label: 'Active',
                  value: row.is_active ? 'Yes' : 'No',
                },
                { label: 'Description', value: row.description, wide: true },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Record</h3>
            <DefinitionList
              items={[
                { label: 'Created', value: formatDateTime(row.created_at) },
                {
                  label: 'Last updated',
                  value: formatDateTime(row.updated_at),
                },
              ]}
            />
          </div>
        </DialogBody>

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
