import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { type Meta } from '@/lib/api-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DataTable, type TableQueryState } from '@/components/data-table'
import { userStatusesQuery } from '../data/api'
import { type User } from '../data/schema'
import { usersColumns as columns } from './columns'

export type UsersQueryState = TableQueryState & {
  statusId?: number
  isActive?: string
  showDeleted?: boolean
}

type UsersTableProps = {
  data: User[]
  meta?: Meta
  isFetching: boolean
  state: UsersQueryState
  onStateChange: (next: Partial<UsersQueryState>) => void
  onRowClick: (user: User) => void
}

/** Server-side users table — paging, sorting and filtering happen in the API. */
export function UsersTable({
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  onRowClick,
}: UsersTableProps) {
  const { data: statuses = [] } = useQuery(userStatusesQuery())

  const hasFilters =
    Boolean(state.search) ||
    Boolean(state.statusId) ||
    Boolean(state.isActive) ||
    Boolean(state.showDeleted)

  const toolbar = (
    <>
      <Input
        placeholder='Search name, username or email...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-60'
      />

      <Select
        value={state.statusId ? String(state.statusId) : 'all'}
        onValueChange={(value) =>
          onStateChange({
            statusId: value === 'all' ? undefined : Number(value),
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-36'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All statuses</SelectItem>
          {statuses.map((status) => (
            <SelectItem key={status.id} value={String(status.id)}>
              {status.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={state.isActive ?? 'all'}
        onValueChange={(value) =>
          onStateChange({
            isActive: value === 'all' ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-32'>
          <SelectValue placeholder='Active' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Any</SelectItem>
          <SelectItem value='1'>Active</SelectItem>
          <SelectItem value='0'>Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* Deletes are soft, so this is the only route back to a deleted account. */}
      <div className='flex items-center gap-2'>
        <Switch
          id='users-show-deleted'
          checked={Boolean(state.showDeleted)}
          onCheckedChange={(checked) =>
            onStateChange({ showDeleted: checked || undefined, page: 1 })
          }
        />
        <Label
          htmlFor='users-show-deleted'
          className='text-sm font-normal whitespace-nowrap'
        >
          Show deleted
        </Label>
      </div>

      {hasFilters && (
        <Button
          variant='ghost'
          className='h-8 px-2 lg:px-3'
          onClick={() =>
            onStateChange({
              search: '',
              statusId: undefined,
              isActive: undefined,
              showDeleted: undefined,
              page: 1,
            })
          }
        >
          Reset
          <X className='ms-2 size-4' />
        </Button>
      )}
    </>
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      meta={meta}
      isFetching={isFetching}
      state={state}
      onStateChange={onStateChange}
      onRowClick={onRowClick}
      isRowDeleted={(user) => Boolean(user.deleted_at)}
      toolbar={toolbar}
      emptyMessage='No users found.'
    />
  )
}
