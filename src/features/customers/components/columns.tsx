import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type Customer } from '../data/schema'
import { CustomersRowActions } from './row-actions'

/** Em dash for a blank optional field, so the column never collapses. */
function orDash(value: string | null | undefined) {
  return value ? value : <span className='text-muted-foreground'>—</span>
}

export const customersColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'first_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
    cell: ({ row }) => (
      <div className='min-w-44'>
        <div className='flex items-center gap-2'>
          <LongText className='max-w-48 font-medium'>
            {row.original.full_name}
          </LongText>
          {row.original.deleted_at && (
            <Badge variant='destructive'>Deleted</Badge>
          )}
        </div>
        <div className='text-xs text-muted-foreground'>
          {row.original.phone}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <LongText className='max-w-56'>{row.original.email || '—'}</LongText>
    ),
  },
  {
    accessorKey: 'company_name',
    header: () => <span>Company</span>,
    enableSorting: false,
    cell: ({ row }) => orDash(row.original.company_name),
  },
  {
    accessorKey: 'region',
    header: () => <span>Region</span>,
    enableSorting: false,
    cell: ({ row }) => orDash(row.original.region),
  },
  {
    id: 'actions',
    cell: ({ row }) => <CustomersRowActions customer={row.original} />,
  },
]
