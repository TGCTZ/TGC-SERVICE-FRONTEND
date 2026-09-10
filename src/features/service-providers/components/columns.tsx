import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { BoolBadge } from '@/components/bool-badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type ServiceProvider } from '../data/schema'
import { ServiceProvidersRowActions } from './row-actions'

export const serviceProvidersColumns: ColumnDef<ServiceProvider>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Provider' />
    ),
    cell: ({ row }) => (
      <div className='min-w-40'>
        <div className='flex items-center gap-2 font-medium'>
          {row.original.name}
          {row.original.deleted_at && (
            <Badge variant='destructive'>Deleted</Badge>
          )}
        </div>
        <div className='text-xs text-muted-foreground'>
          SP {row.original.sp_code}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'group_code',
    header: () => <span>Group code</span>,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.group_code || (
        <span className='text-muted-foreground'>—</span>
      ),
  },
  {
    accessorKey: 'sys_code',
    header: () => <span>System code</span>,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.sys_code || <span className='text-muted-foreground'>—</span>,
  },
  {
    accessorKey: 'is_active',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Active' />
    ),
    cell: ({ row }) => <BoolBadge value={row.original.is_active} />,
  },
  {
    id: 'actions',
    cell: ({ row }) => <ServiceProvidersRowActions provider={row.original} />,
  },
]
