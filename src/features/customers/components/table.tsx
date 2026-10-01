import { X } from 'lucide-react'
import { type Meta } from '@/lib/api-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DataTable, type TableQueryState } from '@/components/data-table'
import { type Customer } from '../data/schema'
import { customersColumns as columns } from './columns'

export type CustomersQueryState = TableQueryState & {
  showDeleted?: boolean
}

type CustomersTableProps = {
  data: Customer[]
  meta?: Meta
  isFetching: boolean
  state: CustomersQueryState
  onStateChange: (next: Partial<CustomersQueryState>) => void
  onRowClick: (customer: Customer) => void
}

/** Server-side customers table — paging, sorting and search happen in the API. */
export function CustomersTable({
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  onRowClick,
}: CustomersTableProps) {
  const hasFilters = Boolean(state.search) || Boolean(state.showDeleted)

  const toolbar = (
    <>
      <Input
        placeholder='Search name, phone, email or company...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-72'
      />

      {/* Deletes are soft, so this is the only route back to a removed record. */}
      <div className='flex items-center gap-2'>
        <Switch
          id='customers-show-deleted'
          checked={Boolean(state.showDeleted)}
          onCheckedChange={(checked) =>
            onStateChange({ showDeleted: checked || undefined, page: 1 })
          }
        />
        <Label
          htmlFor='customers-show-deleted'
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
            onStateChange({ search: '', showDeleted: undefined, page: 1 })
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
      isRowDeleted={(customer) => Boolean(customer.deleted_at)}
      toolbar={toolbar}
      emptyMessage='No customers found.'
    />
  )
}
