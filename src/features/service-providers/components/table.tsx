import { X } from 'lucide-react'
import { type Meta } from '@/lib/api-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DataTable, type TableQueryState } from '@/components/data-table'
import { type ServiceProvider } from '../data/schema'
import { serviceProvidersColumns as columns } from './columns'

export type ServiceProvidersQueryState = TableQueryState & {
  showDeleted?: boolean
}

type ServiceProvidersTableProps = {
  data: ServiceProvider[]
  meta?: Meta
  isFetching: boolean
  state: ServiceProvidersQueryState
  onStateChange: (next: Partial<ServiceProvidersQueryState>) => void
  onRowClick: (provider: ServiceProvider) => void
}

export function ServiceProvidersTable({
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  onRowClick,
}: ServiceProvidersTableProps) {
  const hasFilters = Boolean(state.search) || Boolean(state.showDeleted)

  const toolbar = (
    <>
      <Input
        placeholder='Search name or code...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-60'
      />

      <div className='flex items-center gap-2'>
        <Switch
          id='providers-show-deleted'
          checked={Boolean(state.showDeleted)}
          onCheckedChange={(checked) =>
            onStateChange({ showDeleted: checked || undefined, page: 1 })
          }
        />
        <Label
          htmlFor='providers-show-deleted'
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
      isRowDeleted={(provider) => Boolean(provider.deleted_at)}
      toolbar={toolbar}
      emptyMessage='No service providers found.'
    />
  )
}
