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
import { ordersDataColumns } from '@/features/orders/components/columns'
import { type Order } from '@/features/orders/data/schema'
import { type IdentificationFilter } from '../data/api'

export type IdentificationQueryState = TableQueryState & {
  identification?: IdentificationFilter
}

type IdentificationTableProps = {
  data: Order[]
  meta?: Meta
  isFetching: boolean
  state: IdentificationQueryState
  onStateChange: (next: Partial<IdentificationQueryState>) => void
  /** Rendered as the last column: the one action that clears the row. */
  actionColumn: import('@tanstack/react-table').ColumnDef<Order>
}

/**
 * Orders to work through, by how far their identification has got.
 *
 * The columns are `ordersDataColumns` unchanged, so a row reads here exactly as
 * it does on the Orders screen — the only difference is the trailing button.
 */
export function IdentificationTable({
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  actionColumn,
}: IdentificationTableProps) {
  const hasFilters = Boolean(state.search) || state.identification !== 'pending'

  const toolbar = (
    <>
      <Input
        placeholder='Search reference, customer or phone...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-72'
      />

      <Select
        value={state.identification ?? 'all'}
        onValueChange={(value) =>
          onStateChange({
            identification:
              value === 'all' ? undefined : (value as IdentificationFilter),
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-52'>
          <SelectValue placeholder='Identification' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='pending'>Awaiting identification</SelectItem>
          <SelectItem value='complete'>Fully identified</SelectItem>
          <SelectItem value='all'>All orders</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant='ghost'
          className='h-8 px-2 lg:px-3'
          onClick={() =>
            onStateChange({ search: '', identification: 'pending', page: 1 })
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
      columns={[...ordersDataColumns, actionColumn]}
      data={data}
      meta={meta}
      isFetching={isFetching}
      state={state}
      onStateChange={onStateChange}
      isRowDeleted={(order) => Boolean(order.deleted_at)}
      toolbar={toolbar}
      emptyMessage='Nothing is waiting to be identified.'
    />
  )
}
