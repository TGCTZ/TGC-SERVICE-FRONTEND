import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { StatusBadge } from '@/components/status-badge'
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
    // Same shape as the Order column on the Orders page: what it is, then whose
    // it is. A reference number identifies the paperwork; the name identifies
    // the visit, which is what anyone scanning the list is actually looking for.
    cell: ({ row }) => {
      const stone = row.original

      return (
        <div className='min-w-40'>
          <div className='flex items-center gap-2 font-medium'>
            {stone.label}
            {stone.deleted_at && (
              <StatusBadge tone='danger'>Deleted</StatusBadge>
            )}
          </div>
          <div className='text-sm'>{stone.order_reference ?? '—'}</div>
          {stone.customer_name && (
            <>
              <LongText className='max-w-48 text-xs'>
                {stone.customer_name}
              </LongText>
              <div className='text-xs text-muted-foreground'>
                {stone.customer_phone}
              </div>
            </>
          )}
        </div>
      )
    },
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
