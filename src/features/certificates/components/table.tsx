import { X } from 'lucide-react'
import { type Meta } from '@/lib/api-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, type TableQueryState } from '@/components/data-table'
import { CERTIFICATE_STATUS_LABELS, type Certificate } from '../data/schema'
import { certificatesColumns as columns } from './columns'

export type CertificatesQueryState = TableQueryState & {
  status?: string
}

type CertificatesTableProps = {
  data: Certificate[]
  meta?: Meta
  isFetching: boolean
  state: CertificatesQueryState
  onStateChange: (next: Partial<CertificatesQueryState>) => void
  onRowClick: (certificate: Certificate) => void
}

/** Server-side certificates table. Nothing is deleted here, so no trashed filter. */
export function CertificatesTable({
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  onRowClick,
}: CertificatesTableProps) {
  const hasFilters = Boolean(state.search) || Boolean(state.status)

  const toolbar = (
    <>
      <Input
        placeholder='Search certificate, stone type, order or customer...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-80'
      />

      <Select
        value={state.status ?? 'all'}
        onValueChange={(value) =>
          onStateChange({
            status: value === 'all' ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-36'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All</SelectItem>
          {Object.entries(CERTIFICATE_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant='ghost'
          className='h-8 px-2 lg:px-3'
          onClick={() =>
            onStateChange({ search: '', status: undefined, page: 1 })
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
      toolbar={toolbar}
      emptyMessage='No certificates found.'
    />
  )
}
