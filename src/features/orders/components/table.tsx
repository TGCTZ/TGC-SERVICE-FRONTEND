import { X } from 'lucide-react'
import { type Meta } from '@/lib/api-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DataTable, type TableQueryState } from '@/components/data-table'
import { type Order } from '../data/schema'
import { ordersColumns as columns } from './columns'

export type OrdersQueryState = TableQueryState & {
  showDeleted?: boolean
}

type OrdersTableProps = {
  data: Order[]
  meta?: Meta
  isFetching: boolean
  state: OrdersQueryState
  onStateChange: (next: Partial<OrdersQueryState>) => void
  onRowClick: (order: Order) => void
}

/** Server-side orders table — paging, sorting and search happen in the API. */
export function OrdersTable({
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  onRowClick,
}: OrdersTableProps) {
  const hasFilters = Boolean(state.search) || Boolean(state.showDeleted)

  const toolbar = (
    <>
      <Input
        placeholder='Search reference, customer or phone...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-72'
      />

      <div className='flex items-center gap-2'>
        <Switch
          id='orders-show-deleted'
          checked={Boolean(state.showDeleted)}
          onCheckedChange={(checked) =>
            onStateChange({ showDeleted: checked || undefined, page: 1 })
          }
        />
        <Label
          htmlFor='orders-show-deleted'
          className='text-sm font-normal whitespace-nowrap'
        >
          Show deleted
        </Label>
      </div>

      {hasFilters && (
        <Button
          variant='ghost'
          className='h-8 px-2 lg:px-3'
          onClick={() =>
            onStateChange({ search: '', showDeleted: undefined, page: 1 })
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
      isRowDeleted={(order) => Boolean(order.deleted_at)}
      toolbar={toolbar}
      emptyMessage='No orders found.'
    />
  )
}
