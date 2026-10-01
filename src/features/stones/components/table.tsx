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
import { STONE_STATUS_LABELS } from '../data/enums'
import { type Stone } from '../data/schema'
import { stonesColumns as columns } from './columns'

export type StonesQueryState = TableQueryState & {
  status?: string
  showDeleted?: boolean
}

type StonesTableProps = {
  data: Stone[]
  meta?: Meta
  isFetching: boolean
  state: StonesQueryState
  onStateChange: (next: Partial<StonesQueryState>) => void
  onRowClick: (stone: Stone) => void
}

/** Server-side stones table — paging, sorting and filtering happen in the API. */
export function StonesTable({
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  onRowClick,
}: StonesTableProps) {
  const hasFilters =
    Boolean(state.search) || Boolean(state.status) || Boolean(state.showDeleted)

  const toolbar = (
    <>
      <Input
        placeholder='Search label, order or type...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-64'
      />

      {/* Every status is offered here, including the ones only the pipeline
        writes — filtering by them is exactly how you find those stones. */}
      <Select
        value={state.status ?? 'all'}
        onValueChange={(value) =>
          onStateChange({
            status: value === 'all' ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-44'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All statuses</SelectItem>
          {Object.entries(STONE_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className='flex items-center gap-2'>
        <Switch
          id='stones-show-deleted'
          checked={Boolean(state.showDeleted)}
          onCheckedChange={(checked) =>
            onStateChange({ showDeleted: checked || undefined, page: 1 })
          }
        />
        <Label
          htmlFor='stones-show-deleted'
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
              status: undefined,
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
      isRowDeleted={(stone) => Boolean(stone.deleted_at)}
      toolbar={toolbar}
      emptyMessage='No stones found.'
    />
  )
}
