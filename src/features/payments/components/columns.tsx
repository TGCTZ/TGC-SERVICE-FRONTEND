import { type ColumnDef } from '@tanstack/react-table'
import { formatDateTime, formatMoney } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Payment } from '../data/schema'
import { PaymentsRowActions } from './row-actions'

/**
 * Four columns out of twenty-odd fields.
 *
 * The rest of the gateway's notification belongs in the view dialog: it is
 * evidence to consult when a payment is questioned, not something to scan.
 */
export const paymentsColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'trx_id',
    header: () => <span>Transaction</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className='min-w-40'>
        <div className='font-medium'>{row.original.trx_id || '—'}</div>
        <div className='text-xs text-muted-foreground'>
          {row.original.psp_name || 'Unknown provider'}
        </div>
      </div>
    ),
  },
  {
    id: 'bill',
    header: () => <span>Bill</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className='min-w-32'>
        <div>{row.original.bill_ctr_num || '—'}</div>
        <div className='text-xs text-muted-foreground'>
          {row.original.pyr_name || ''}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'paid_amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Paid' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span className='tabular-nums'>
          {formatMoney(
            Number(row.original.paid_amount ?? 0),
            row.original.currency ?? undefined
          )}
        </span>
        {/* Unprocessed means the notification arrived but has not been applied
          to its bill — worth seeing without opening the record. */}
        {!row.original.is_processed && (
          <Badge variant='destructive'>Unprocessed</Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'trx_dt_tm',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='When' />
    ),
    cell: ({ row }) => formatDateTime(row.original.trx_dt_tm),
  },
  {
    id: 'actions',
    cell: ({ row }) => <PaymentsRowActions payment={row.original} />,
  },
]
