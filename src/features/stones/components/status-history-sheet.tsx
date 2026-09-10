import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ListOrdered } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { stoneStatusHistoryQuery } from '../data/api'
import { STONE_STATUS_LABELS } from '../data/enums'
import { type Stone } from '../data/schema'
import { StoneStatusBadge } from './status-badge'

type StatusHistorySheetProps = {
  stone: Stone
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * A stone's status trail.
 *
 * Distinct from `<RecordHistorySheet>`, which shows the generic audit log of
 * field changes. This is the domain ledger the pipeline writes: it answers
 * "how did this stone get here, and who moved it", including the moves the
 * payment gateway made with no user attached.
 */
export function StoneStatusHistorySheet({
  stone,
  open,
  onOpenChange,
}: StatusHistorySheetProps) {
  const { data, isPending, isError } = useQuery({
    ...stoneStatusHistoryQuery(stone.id),
    // Tied to `open` so closed sheets across a page of rows fire no requests.
    enabled: open,
  })

  const entries = data ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='overflow-y-auto'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <ListOrdered className='size-4' />
            Status history
          </SheetTitle>
          <SheetDescription>
            {stone.order_reference
              ? `${stone.order_reference} / ${stone.label}`
              : stone.label}
          </SheetDescription>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          {isPending && (
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className='h-16 w-full' />
              ))}
            </div>
          )}

          {isError && (
            <p className='text-sm text-destructive'>
              Could not load the status history.
            </p>
          )}

          {!isPending && !isError && entries.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              No status changes recorded yet.
            </p>
          )}

          {entries.map((entry) => (
            <div key={entry.id} className='rounded-md border p-3'>
              <div className='flex flex-wrap items-center gap-2'>
                {entry.from_status ? (
                  <>
                    <span className='text-sm text-muted-foreground'>
                      {STONE_STATUS_LABELS[entry.from_status] ??
                        entry.from_status}
                    </span>
                    <ArrowRight className='size-3 text-muted-foreground' />
                  </>
                ) : (
                  <span className='text-sm text-muted-foreground'>
                    Registered as
                  </span>
                )}
                <StoneStatusBadge status={entry.to_status} />
              </div>

              <div className='mt-2 text-xs text-muted-foreground'>
                {formatDateTime(entry.changed_at)} · {entry.changed_by_label}
              </div>

              {entry.note && <p className='mt-2 text-sm'>{entry.note}</p>}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
