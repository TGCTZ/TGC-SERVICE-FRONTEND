import { type ColumnDef } from '@tanstack/react-table'
import { formatMoney } from '@/lib/format'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type Bill } from '../data/schema'
import { BillsRowActions } from './row-actions'
import { BillStatusBadge } from './status-badge'

export const billsColumns: ColumnDef<Bill>[] = [
  {
    accessorKey: 'bill_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Bill' />
    ),
    cell: ({ row }) => (
      <div className='min-w-40'>
        <div className='font-medium'>{row.original.bill_number}</div>
        {/* The control number is what the customer quotes when paying, so it
          belongs on the row rather than behind a dialog. */}
        <div className='text-xs text-muted-foreground'>
          {row.original.control_number ?? 'Awaiting control number'}
        </div>
      </div>
    ),
  },
  {
    id: 'order',
    header: () => <span>Order</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className='min-w-36'>
        <div>{row.original.order_reference ?? '—'}</div>
        <LongText className='max-w-44 text-xs text-muted-foreground'>
          {row.original.customer_name ?? ''}
        </LongText>
      </div>
    ),
  },
  {
    accessorKey: 'total_amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Amount' />
    ),
    cell: ({ row }) => {
      const bill = row.original
      const paid = Number(bill.amount_paid ?? 0)

      return (
        <div className='min-w-32 tabular-nums'>
          <div>
            {formatMoney(Number(bill.total_amount ?? 0), bill.currency)}
          </div>
          <div className='text-xs text-muted-foreground'>
            {paid > 0
              ? `${formatMoney(paid, bill.currency)} paid`
              : 'Nothing paid'}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => <BillStatusBadge status={row.original.status} />,
  },
  {
    id: 'actions',
    cell: ({ row }) => <BillsRowActions bill={row.original} />,
  },
]
