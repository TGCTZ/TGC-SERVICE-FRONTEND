import { type ReactNode, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Can } from '@/components/can'
import { DataTable, type TableQueryState } from '@/components/data-table'
import { type WorkflowRow } from './data/api'

export type WorkflowListState = TableQueryState & {
  status?: string
  type?: string
  source?: string
}

type Props = {
  rows: WorkflowRow[]
  count: number
  isFetching: boolean
  state: WorkflowListState
  onStateChange: (next: Partial<WorkflowListState>) => void
  actionPermission?: string | string[]
  actionLabel?: string
  actionOnRecords?: boolean
  permissionForRow?: (row: WorkflowRow) => string | string[] | undefined
  labelForRow?: (row: WorkflowRow) => string
  renderAction?: (row: WorkflowRow) => ReactNode
  renderStatus?: (row: WorkflowRow) => ReactNode
  onAction?: (row: WorkflowRow) => void
  onRowClick?: (row: WorkflowRow) => void
}

export function WorkflowFeedTable({
  rows,
  count,
  isFetching,
  state,
  onStateChange,
  actionPermission,
  actionLabel,
  actionOnRecords = false,
  permissionForRow,
  labelForRow,
  renderAction,
  renderStatus,
  onAction,
  onRowClick,
}: Props) {
  const meta = useMemo(
    () => ({
      current_page: state.page,
      last_page: Math.max(1, Math.ceil(count / state.perPage)),
      per_page: state.perPage,
      total: count,
    }),
    [count, state.page, state.perPage]
  )

  const columns = useMemo<ColumnDef<WorkflowRow>[]>(
    () => [
      { accessorKey: 'reference', header: 'Reference' },
      { accessorKey: 'customer', header: 'Customer' },
      { accessorKey: 'type', header: 'Type' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) =>
          renderStatus ? renderStatus(row.original) : row.original.status,
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) =>
          row.original.date ? formatDate(row.original.date) : '—',
      },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => {
          const record = row.original
          if (renderAction) return renderAction(record)
          const permission = permissionForRow
            ? permissionForRow(record)
            : record.waiting || actionOnRecords
              ? actionPermission
              : undefined
          if (!permission || !onAction)
            return <span className='text-muted-foreground'>View</span>
          return (
            <Can permission={permission}>
              <Button
                size='sm'
                variant='outline'
                onClick={() => onAction?.(record)}
              >
                {labelForRow?.(record) ?? actionLabel ?? 'Open'}
              </Button>
            </Can>
          )
        },
      },
    ],
    [
      actionLabel,
      actionOnRecords,
      actionPermission,
      labelForRow,
      renderAction,
      renderStatus,
      onAction,
      permissionForRow,
    ]
  )

  const typeOptions = [
    ...new Set([
      'Order',
      'Bill',
      'Findings',
      'Stone findings',
      'Certificate',
      'Stone certification',
      ...rows.map((row) => row.type),
    ]),
  ]
  const statusOptions = [
    ...new Set([
      'Identifying',
      'Ready to bill',
      'Billing attention',
      'Draft',
      'Finalized',
      'Awaiting findings',
      'issued',
      'revoked',
      'pending',
      'partially_paid',
      'paid',
      'cancelled',
      ...rows.map((row) => row.status),
    ]),
  ]

  const toolbar = (
    <>
      <Input
        aria-label='Search records'
        placeholder='Search reference or customer…'
        className='h-8 w-full max-w-72'
        value={state.search}
        onChange={(event) =>
          onStateChange({ search: event.target.value, page: 1 })
        }
      />
      <Select
        value={state.source ?? 'all'}
        onValueChange={(value) =>
          onStateChange({
            source: value === 'all' ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-36'>
          <SelectValue placeholder='Work status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All records</SelectItem>
          <SelectItem value='waiting'>Waiting</SelectItem>
          <SelectItem value='records'>Completed work</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={state.type ?? 'all'}
        onValueChange={(value) =>
          onStateChange({ type: value === 'all' ? undefined : value, page: 1 })
        }
      >
        <SelectTrigger className='h-8 w-40'>
          <SelectValue placeholder='Type' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All types</SelectItem>
          {typeOptions.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={state.status ?? 'all'}
        onValueChange={(value) =>
          onStateChange({
            status: value === 'all' ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-40'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All statuses</SelectItem>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )

  return (
    <DataTable
      columns={columns}
      data={rows}
      meta={meta}
      isFetching={isFetching}
      state={state}
      onStateChange={onStateChange}
      onRowClick={onRowClick}
      toolbar={toolbar}
      emptyMessage='No matching work found.'
      showSerialNumber={false}
    />
  )
}
