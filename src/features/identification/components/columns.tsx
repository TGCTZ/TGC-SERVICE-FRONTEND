import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { StatusBadge } from '@/components/status-badge'
import { type IdentificationReport } from '../data/schema'
import { ReportsRowActions } from './row-actions'

export const reportsColumns: ColumnDef<IdentificationReport>[] = [
  {
    accessorKey: 'report_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Report' />
    ),
    cell: ({ row }) => (
      <div className='min-w-40'>
        <div className='flex items-center gap-2 font-medium'>
          {row.original.report_number}
          {row.original.deleted_at && (
            <StatusBadge tone='danger'>Deleted</StatusBadge>
          )}
        </div>
        <div className='text-xs text-muted-foreground'>
          Stone {row.original.stone_label ?? '—'}
        </div>
      </div>
    ),
  },
  {
    id: 'order',
    header: () => <span>Order</span>,
    enableSorting: false,
    // Shaped like the Order column on the Orders page: reference, then who it
    // belongs to. A reference number alone identifies the paperwork; the name
    // is what identifies the visit to anyone scanning a list of them.
    cell: ({ row }) => {
      const report = row.original

      return (
        <div className='min-w-40'>
          <div>{report.order_reference ?? '—'}</div>
          {report.customer_name && (
            <>
              <LongText className='max-w-48 text-sm'>
                {report.customer_name}
              </LongText>
              <div className='text-xs text-muted-foreground'>
                {report.customer_phone}
              </div>
            </>
          )}
        </div>
      )
    },
  },
  {
    id: 'findings',
    header: () => <span>Findings</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const report = row.original
      const species = report.species_detail?.name
      const variety = report.variety_detail?.name

      if (!species && !variety) {
        return <span className='text-muted-foreground'>Not yet recorded</span>
      }

      return (
        <div className='min-w-36'>
          <div>{species ?? '—'}</div>
          {variety && (
            <LongText className='max-w-44 text-xs text-muted-foreground'>
              {variety}
            </LongText>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'is_finalized',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) =>
      row.original.is_finalized ? (
        <StatusBadge tone='success'>Finalized</StatusBadge>
      ) : (
        <StatusBadge tone='neutral'>Draft</StatusBadge>
      ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <ReportsRowActions report={row.original} />,
  },
]
