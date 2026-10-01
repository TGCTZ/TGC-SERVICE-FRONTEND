import { type ColumnDef } from '@tanstack/react-table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { StatusBadge } from '@/components/status-badge'
import { type User } from '../data/schema'
import { UsersRowActions } from './row-actions'

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
            <AvatarImage src={user.avatar ?? undefined} alt={user.full_name} />
            <AvatarFallback className='text-xs'>
              {initials(user.full_name || user.username)}
            </AvatarFallback>
          </Avatar>
          <div>
            <LongText className='max-w-48 font-medium'>
              {user.full_name || user.email}
            </LongText>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              @{user.username}
              {(user.must_change_password || user.must_complete_profile) && (
                <StatusBadge tone='warning'>Awaiting first login</StatusBadge>
              )}
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
        <StatusBadge tone='success'>Active</StatusBadge>
      ) : (
        <StatusBadge tone='danger'>Inactive</StatusBadge>
      ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <UsersRowActions user={row.original} />,
  },
]
