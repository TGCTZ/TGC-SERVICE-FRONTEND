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
import { type IdentificationReport } from '../data/schema'
import { reportsColumns as columns } from './columns'

export type ReportsQueryState = TableQueryState & {
  finalized?: string
  showDeleted?: boolean
}

type ReportsTableProps = {
  data: IdentificationReport[]
  meta?: Meta
  isFetching: boolean
  state: ReportsQueryState
  onStateChange: (next: Partial<ReportsQueryState>) => void
  onRowClick: (report: IdentificationReport) => void
}

export function ReportsTable({
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  onRowClick,
}: ReportsTableProps) {
  const hasFilters =
    Boolean(state.search) ||
    Boolean(state.finalized) ||
    Boolean(state.showDeleted)

  const toolbar = (
    <>
      <Input
        placeholder='Search report, stone, order or conclusion...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-80'
      />

      {/* Drafts are the working set: a gemmologist wants what is still open. */}
      <Select
        value={state.finalized ?? 'all'}
        onValueChange={(value) =>
          onStateChange({
            finalized: value === 'all' ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-36'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All reports</SelectItem>
          <SelectItem value='0'>Draft</SelectItem>
          <SelectItem value='1'>Finalized</SelectItem>
        </SelectContent>
      </Select>

      <div className='flex items-center gap-2'>
        <Switch
          id='reports-show-deleted'
          checked={Boolean(state.showDeleted)}
          onCheckedChange={(checked) =>
            onStateChange({ showDeleted: checked || undefined, page: 1 })
          }
        />
        <Label
          htmlFor='reports-show-deleted'
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
              finalized: undefined,
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
      isRowDeleted={(report) => Boolean(report.deleted_at)}
      toolbar={toolbar}
      emptyMessage='No identification reports found.'
    />
  )
}
