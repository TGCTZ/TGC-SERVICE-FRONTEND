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
import { ORDER_STAGE_LABELS, type Order } from '@/features/orders/data/schema'

/** Radix forbids an empty-string SelectItem value, so "any stage" needs one. */
const ANY_STAGE = 'all'

export type IdentificationQueryState = TableQueryState & {
  /** An `OrderStage` value, or undefined for every stage. */
  stage?: string
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
  const hasFilters = Boolean(state.search) || Boolean(state.stage)

  const toolbar = (
    <>
      <Input
        placeholder='Search reference, customer or phone...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-72'
      />

      {/* The same filter and values the Orders screen uses, because these are
          the same rows with the same Status column - minus "No stones yet" and
          "Awaiting identification". Both mean stones still to type, which is
          the identification queue's work, and this page never lists them. */}
      <Select
        value={state.stage ?? ANY_STAGE}
        onValueChange={(value) =>
          onStateChange({
            stage: value === ANY_STAGE ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-56'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY_STAGE}>All statuses</SelectItem>
          {Object.entries(ORDER_STAGE_LABELS)
            .filter(([stage]) => stage !== 'identifying' && stage !== 'empty')
            .map(([stage, label]) => (
              <SelectItem key={stage} value={stage}>
                {label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant='ghost'
          className='h-8 px-2 lg:px-3'
          onClick={() =>
            onStateChange({ search: '', stage: undefined, page: 1 })
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
      emptyMessage='No orders found.'
    />
  )
}
