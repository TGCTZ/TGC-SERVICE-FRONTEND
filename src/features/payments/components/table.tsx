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
import { type Payment } from '../data/schema'
import { paymentsColumns as columns } from './columns'

export type PaymentsQueryState = TableQueryState & {
  processed?: string
}

type PaymentsTableProps = {
  data: Payment[]
  meta?: Meta
  isFetching: boolean
  state: PaymentsQueryState
  onStateChange: (next: Partial<PaymentsQueryState>) => void
  onRowClick: (payment: Payment) => void
}

/** Server-side payments table. Nothing is deletable, so no trashed filter. */
export function PaymentsTable({
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  onRowClick,
}: PaymentsTableProps) {
  const hasFilters = Boolean(state.search) || Boolean(state.processed)

  const toolbar = (
    <>
      <Input
        placeholder='Search transaction, payer or provider...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-72'
      />

      {/* An unprocessed notification is the one thing worth filtering for:
        money arrived that has not reached its bill. */}
      <Select
        value={state.processed ?? 'all'}
        onValueChange={(value) =>
          onStateChange({
            processed: value === 'all' ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-40'>
          <SelectValue placeholder='Processing' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All payments</SelectItem>
          <SelectItem value='1'>Processed</SelectItem>
          <SelectItem value='0'>Unprocessed</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant='ghost'
          className='h-8 px-2 lg:px-3'
          onClick={() =>
            onStateChange({ search: '', processed: undefined, page: 1 })
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
      emptyMessage='No payments found.'
    />
  )
}
