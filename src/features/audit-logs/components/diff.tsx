import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type AuditDiffProps = {
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  className?: string
}

/** Turn `product_category_id` into `Product category`. */
function humanize(field: string) {
  const label = field.replace(/_id$/, '').replace(/_/g, ' ').trim()

  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * Render a value for display.
 *
 * Everything arrives as `unknown` because the shape differs per model, so this
 * has to cope with nulls, booleans, arrays (role/permission lists) and nested
 * JSON columns without throwing.
 */
function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  if (typeof value === 'object') return JSON.stringify(value)

  return String(value)
}

/**
 * Field-level before/after view of one audit entry.
 *
 * Shared by the audit-log detail sheet and the per-record History sheet so a
 * diff never renders differently depending on where it was opened from.
 */
export function AuditDiff({ oldValues, newValues, className }: AuditDiffProps) {
  // The union of both sides: a created event has only `new`, a deleted event
  // only `old`, and an update has a matching pair.
  const fields = Array.from(
    new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})])
  ).sort()

  if (fields.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        No field changes recorded for this event.
      </p>
    )
  }

  return (
    <div className={cn('overflow-x-auto rounded-md border', className)}>
      <table className='w-full table-fixed text-sm'>
        <colgroup>
          <col className='w-[22%]' />
          <col className='w-[39%]' />
          <col className='w-[39%]' />
        </colgroup>
        <thead className='bg-muted/50 text-muted-foreground'>
          <tr>
            <th className='px-3 py-2 text-start font-medium'>Field</th>
            <th className='px-3 py-2 text-start font-medium'>Before</th>
            <th className='px-3 py-2 text-start font-medium'>After</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => {
            const before = display(oldValues?.[field])
            const after = display(newValues?.[field])

            return (
              <tr key={field} className='border-t align-top'>
                <td className='px-3 py-2 font-medium break-words'>
                  {humanize(field)}
                </td>
                <td
                  className={cn(
                    'px-3 py-2 break-words text-muted-foreground',
                    // Only strike through a value that actually existed; a
                    // struck-out placeholder on a "created" event reads as if
                    // something was removed.
                    before !== '—' && 'line-through decoration-destructive/50'
                  )}
                >
                  <div className='max-h-40 overflow-y-auto'>{before}</div>
                </td>
                <td className='px-3 py-2'>
                  <div className='flex items-start gap-1.5'>
                    <ArrowRight className='mt-0.5 size-3.5 shrink-0 text-muted-foreground' />
                    <div className='max-h-40 overflow-y-auto break-words'>
                      {after}
                    </div>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
