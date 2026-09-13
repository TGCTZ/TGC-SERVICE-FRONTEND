import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
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
            <Badge variant='destructive'>Deleted</Badge>
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
    cell: ({ row }) => row.original.order_reference ?? '—',
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
        <Badge>Finalized</Badge>
      ) : (
        <Badge variant='secondary'>Draft</Badge>
      ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <ReportsRowActions report={row.original} />,
  },
]
