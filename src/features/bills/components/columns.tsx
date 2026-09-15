import { type ColumnDef } from '@tanstack/react-table'
import { formatMoney } from '@/lib/format'
import { Progress } from '@/components/ui/progress'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { StatusBadge } from '@/components/status-badge'
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
      <div className='min-w-32 font-medium'>{row.original.bill_number}</div>
    ),
  },
  {
    id: 'control_number',
    header: () => <span>Control number</span>,
    enableSorting: false,
    // Its own column, not a subtitle under the bill number: this is the digits
    // the customer reads out at the bank, so it is looked up and read across
    // rather than glanced at. A missing one is also a real failure state — the
    // bill exists but nobody can pay it — which a muted subtitle understated.
    cell: ({ row }) =>
      row.original.control_number ? (
        <span className='min-w-36 font-medium tabular-nums'>
          {row.original.control_number}
        </span>
      ) : (
        <StatusBadge tone='danger'>Awaiting number</StatusBadge>
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
      const total = Number(bill.total_amount ?? 0)
      const paid = Number(bill.amount_paid ?? 0)

      return (
        <div className='min-w-40 space-y-1.5 tabular-nums'>
          <div>{formatMoney(total, bill.currency)}</div>
          {/* A part-paid bill is the case the number alone hides: "40,000 paid"
              against a 100,000 total reads as progress only once you do the
              arithmetic. */}
          <Progress
            value={paid}
            max={total}
            label={`Payment progress for ${bill.bill_number}`}
          />
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
