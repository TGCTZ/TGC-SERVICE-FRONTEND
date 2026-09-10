import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { WEIGHT_UNIT_SYMBOLS } from '../data/enums'
import { type Stone } from '../data/schema'
import { StonesRowActions } from './row-actions'
import { StoneStatusBadge } from './status-badge'

/** Weight with its unit, or an em dash when it was never recorded. */
export function formatWeight(stone: Stone) {
  if (!stone.weight) return '—'
  const symbol = WEIGHT_UNIT_SYMBOLS[stone.weight_unit] ?? stone.weight_unit
  return `${stone.weight} ${symbol}`
}

/**
 * The stone columns, shared with the worklist screens.
 *
 * Split from the actions column so the worklist screens can reuse the data
 * columns and swap that last one for a single primary-action button.
 */
export const stonesDataColumns: ColumnDef<Stone>[] = [
  {
    accessorKey: 'label',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Stone' />
    ),
    cell: ({ row }) => (
      <div className='min-w-32'>
        <div className='flex items-center gap-2 font-medium'>
          {row.original.label}
          {row.original.deleted_at && (
            <Badge variant='destructive'>Deleted</Badge>
          )}
        </div>
        <div className='text-xs text-muted-foreground'>
          {row.original.order_reference ?? '—'}
        </div>
      </div>
    ),
  },
  {
    id: 'stone_type',
    header: () => <span>Type</span>,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.stone_type_detail?.name ?? (
        <span className='text-muted-foreground'>—</span>
      ),
  },
  {
    accessorKey: 'weight',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Weight' />
    ),
    cell: ({ row }) => formatWeight(row.original),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => <StoneStatusBadge status={row.original.status} />,
  },
]

export const stonesColumns: ColumnDef<Stone>[] = [
  ...stonesDataColumns,
  {
    id: 'actions',
    cell: ({ row }) => <StonesRowActions stone={row.original} />,
  },
]
