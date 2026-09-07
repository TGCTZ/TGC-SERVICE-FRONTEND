import { X } from 'lucide-react'
import { type Meta } from '@/lib/api-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, type TableQueryState } from '@/components/data-table'
import { auditEvents, type ActivityLog } from '../data/schema'
import { auditLogsColumns as columns } from './audit-logs-columns'

export type AuditLogsQueryState = TableQueryState & {
  event?: string
  dateFrom?: string
  dateTo?: string
}

type AuditLogsTableProps = {
  data: ActivityLog[]
  meta?: Meta
  isFetching: boolean
  state: AuditLogsQueryState
  onStateChange: (next: Partial<AuditLogsQueryState>) => void
  onRowClick: (log: ActivityLog) => void
}

/**
 * Server-side audit table.
 *
 * Audit rows are immutable, so there is no actions menu: View is the only
 * thing you can do to an entry, and clicking the row does it.
 */
export function AuditLogsTable({
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  onRowClick,
}: AuditLogsTableProps) {
  const hasFilters =
    Boolean(state.search) ||
    Boolean(state.event) ||
    Boolean(state.dateFrom) ||
    Boolean(state.dateTo)

  const toolbar = (
    <>
      <Input
        placeholder='Search description, actor or subject...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-64'
      />

      <Select
        value={state.event ?? 'all'}
        onValueChange={(value) =>
          onStateChange({
            event: value === 'all' ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-44'>
          <SelectValue placeholder='Event' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All events</SelectItem>
          {auditEvents.map((event) => (
            <SelectItem key={event} value={event}>
              {event.replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Native date inputs: the range is two independent, optional bounds,
          which a calendar popover makes fussier rather than easier. */}
      <Input
        type='date'
        aria-label='From date'
        value={state.dateFrom ?? ''}
        onChange={(e) =>
          onStateChange({ dateFrom: e.target.value || undefined, page: 1 })
        }
        className='h-8 w-36'
      />
      <Input
        type='date'
        aria-label='To date'
        value={state.dateTo ?? ''}
        onChange={(e) =>
          onStateChange({ dateTo: e.target.value || undefined, page: 1 })
        }
        className='h-8 w-36'
      />

      {hasFilters && (
        <Button
          variant='ghost'
          className='h-8 px-2 lg:px-3'
          onClick={() =>
            onStateChange({
              search: '',
              event: undefined,
              dateFrom: undefined,
              dateTo: undefined,
              page: 1,
            })
          }
        >
          Reset
          <X className='ms-2 size-4' />
        </Button>
      )}
    </>
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      meta={meta}
      isFetching={isFetching}
      state={state}
      onStateChange={onStateChange}
      onRowClick={onRowClick}
      toolbar={toolbar}
      emptyMessage='No activity found.'
    />
  )
}
