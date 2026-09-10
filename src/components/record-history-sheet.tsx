import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { AuditDiff } from '@/features/audit-logs/components/diff'
import { AuditEventBadge } from '@/features/audit-logs/components/event-badge'
import { recordHistoryQueryOptions } from '@/features/audit-logs/data/api'

type RecordHistorySheetProps = {
  /** Model name as the audit trail records it, e.g. `stone`. See `@/lib/subject-types`. */
  subjectType: string
  subjectId: number
  /** Shown in the sheet header so the user knows which record they opened. */
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Timeline of everything that has happened to one record.
 *
 * Deliberately feature-agnostic: it only needs a subject type and id, so any
 * module gains record history by dropping this component into its row actions
 * rather than growing its own copy of the same view.
 */
export function RecordHistorySheet({
  subjectType,
  subjectId,
  title,
  open,
  onOpenChange,
}: RecordHistorySheetProps) {
  // `enabled` is tied to `open` so closed sheets in a table of 25 rows do not
  // each fire their own request.
  const { data, isPending, isError } = useQuery(
    recordHistoryQueryOptions(subjectType, subjectId, open)
  )

  const entries = data?.items ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='overflow-y-auto'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <History className='size-4' />
            History
          </SheetTitle>
          <SheetDescription>{title}</SheetDescription>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          {isPending && (
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className='h-24 w-full' />
              ))}
            </div>
          )}

          {isError && (
            <p className='text-sm text-destructive'>
              Could not load this record&apos;s history.
            </p>
          )}

          {!isPending && !isError && entries.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              No activity recorded for this record yet.
            </p>
          )}

          {entries.map((entry, index) => (
            <div key={entry.id} className='space-y-2'>
              {index > 0 && <Separator />}

              <div className='flex flex-wrap items-center gap-2 pt-2'>
                <AuditEventBadge event={entry.event} />
                <span className='text-sm'>
                  {entry.causer_label ?? 'System'}
                </span>
                <span className='ms-auto text-xs text-muted-foreground'>
                  {formatDateTime(entry.created_at)}
                </span>
              </div>

              <AuditDiff
                oldValues={entry.old_values}
                newValues={entry.new_values}
              />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
