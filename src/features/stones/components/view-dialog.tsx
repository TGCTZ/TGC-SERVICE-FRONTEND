import { useQuery } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { perm } from '@/lib/permissions'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { StatusBadge } from '@/components/status-badge'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { stoneStatusHistoryQuery } from '../data/api'
import { STONE_STATUS_LABELS, isStoneLocked } from '../data/enums'
import { type Stone } from '../data/schema'
import { formatWeight } from './columns'
import { StoneStatusBadge } from './status-badge'

type StoneViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  stone: Stone
  /** Switches the view into the edit form, when the user may edit. */
  onRequestEdit?: () => void
  actions?: RowAction[]
}

/** A status code rendered with its label, for the history trail. */
function statusLabel(status: string): string {
  return STONE_STATUS_LABELS[status] ?? status
}

/**
 * Everything known about one stone, including how it got to its status.
 *
 * A definition list rather than the mutate form with `disabled` on its fields:
 * most of a stone is read-only to everyone — the label, the order and the
 * status are all written by the service — so a form implies edits that were
 * never on offer. The status trail is the part a disabled form could not show
 * at all, and it is usually the reason someone opened the stone.
 */
export function StoneViewDialog({
  open,
  onOpenChange,
  stone,
  onRequestEdit,
  actions = [],
}: StoneViewDialogProps) {
  // Only while the dialog is open: the trail is its own endpoint.
  const { data: history, isPending } = useQuery({
    ...stoneStatusHistoryQuery(stone.id),
    enabled: open,
  })

  const locked = isStoneLocked(stone)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex flex-wrap items-center gap-2'>
            {stone.label}
            <StoneStatusBadge status={stone.status} />
            {stone.deleted_at && (
              <StatusBadge tone='danger'>Deleted</StatusBadge>
            )}
          </DialogTitle>
          <DialogDescription>
            {stone.order_reference ?? 'Unknown order'}
            {stone.stone_type_detail
              ? ` · ${stone.stone_type_detail.name}`
              : ' · Untyped'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Stone</h3>
            <DefinitionList
              items={[
                { label: 'Label', value: stone.label },
                { label: 'Order', value: stone.order_reference },
                {
                  label: 'Type',
                  value: stone.stone_type_detail?.name ?? null,
                },
                { label: 'Weight', value: formatWeight(stone) },
                { label: 'Status', value: statusLabel(stone.status) },
                {
                  label: 'Type editable',
                  value: locked
                    ? 'No — a bill has been priced from this stone'
                    : 'Yes',
                },
              ]}
            />
          </div>

          <Separator />

          {/* The trail, not the audit log: it records why a stone moved, and
              includes moves the payment gateway made with no user attached. */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Status history</h3>

            {isPending && <Skeleton className='h-16 w-full' />}

            {!isPending && history?.length === 0 && (
              <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
                No status changes recorded yet.
              </p>
            )}

            {history && history.length > 0 && (
              <ul className='divide-y rounded-md border'>
                {history.map((entry) => (
                  <li key={entry.id} className='space-y-1 p-3'>
                    <div className='flex flex-wrap items-center gap-2 text-sm'>
                      {entry.from_status && (
                        <>
                          <span className='text-muted-foreground'>
                            {statusLabel(entry.from_status)}
                          </span>
                          <span className='text-muted-foreground'>→</span>
                        </>
                      )}
                      <span className='font-medium'>
                        {statusLabel(entry.to_status)}
                      </span>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {entry.changed_by_label} ·{' '}
                      {formatDateTime(entry.changed_at)}
                    </div>
                    {entry.note && <p className='text-sm'>{entry.note}</p>}
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
                { label: 'Created', value: formatDateTime(stone.created_at) },
                {
                  label: 'Last updated',
                  value: formatDateTime(stone.updated_at),
                },
              ]}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <ViewFooterActions
            actions={actions}
            primary={
              // Hidden once billed: the type is the price, so the edit form
              // would refuse every change it offered.
              onRequestEdit &&
              !locked && (
                <Can permission={perm('stones', 'change')}>
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
