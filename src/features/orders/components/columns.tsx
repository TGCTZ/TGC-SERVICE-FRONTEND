import { type ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { isFullyRegistered, type Order } from '../data/schema'
import { OrdersRowActions } from './row-actions'

/**
 * The order columns, shared with the worklist screens.
 *
 * Split from the actions column so the worklist screens can reuse the data
 * columns and swap that last one for a single primary-action button.
 */
export const ordersDataColumns: ColumnDef<Order>[] = [
  {
    accessorKey: 'reference_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Order' />
    ),
    cell: ({ row }) => (
      <div className='min-w-36'>
        <div className='flex items-center gap-2 font-medium'>
          {row.original.reference_number}
          {row.original.deleted_at && (
            <Badge variant='destructive'>Deleted</Badge>
          )}
        </div>
        <div className='text-xs text-muted-foreground'>
          Received {formatDate(row.original.received_date)}
        </div>
      </div>
    ),
  },
  {
    id: 'customer',
    header: () => <span>Customer</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const customer = row.original.customer_detail
      if (!customer) return <span className='text-muted-foreground'>—</span>

      return (
        <div className='min-w-40'>
          <LongText className='max-w-48'>{customer.full_name}</LongText>
          <div className='text-xs text-muted-foreground'>{customer.phone}</div>
        </div>
      )
    },
  },
  {
    id: 'stones',
    header: () => <span>Stones</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const order = row.original
      const complete = isFullyRegistered(order)

      return (
        <div className='flex items-center gap-2'>
          <span className='tabular-nums'>
            {order.identified_count} / {order.stone_count}
          </span>
          {/* An order is only ready to bill once every stone is registered. */}
          <Badge variant={complete ? 'default' : 'secondary'}>
            {complete ? 'Registered' : 'Pending'}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'received_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Received' />
    ),
    cell: ({ row }) => formatDate(row.original.received_date),
  },
]

export const ordersColumns: ColumnDef<Order>[] = [
  ...ordersDataColumns,
  {
    id: 'actions',
    cell: ({ row }) => <OrdersRowActions order={row.original} />,
  },
]
