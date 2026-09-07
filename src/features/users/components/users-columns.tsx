import { type ColumnDef } from '@tanstack/react-table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type User } from '../data/schema'
import { UsersRowActions } from './users-row-actions'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export const usersColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'full_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='User' />
    ),
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className='flex min-w-48 items-center gap-3'>
          <Avatar className='size-8'>
            <AvatarImage
              src={user.avatar_url ?? undefined}
              alt={user.full_name}
            />
            <AvatarFallback className='text-xs'>
              {initials(user.full_name || user.username)}
            </AvatarFallback>
          </Avatar>
          <div>
            <LongText className='max-w-48 font-medium'>
              {user.full_name}
            </LongText>
            <div className='text-xs text-muted-foreground'>
              @{user.username}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-56'>{row.original.email}</LongText>
    ),
  },
  {
    id: 'roles',
    header: () => <span>Roles</span>,
    cell: ({ row }) => {
      const roles = row.original.roles

      if (roles.length === 0) {
        return <span className='text-muted-foreground'>None</span>
      }

      return (
        <div className='flex flex-wrap gap-1'>
          {roles.map((role) => (
            <Badge key={role} variant='secondary' className='capitalize'>
              {role}
            </Badge>
          ))}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'is_active',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Active' />
    ),
    cell: ({ row }) =>
      row.original.is_active ? (
        <Badge variant='outline'>Active</Badge>
      ) : (
        <Badge variant='destructive'>Inactive</Badge>
      ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <UsersRowActions user={row.original} />,
  },
]
