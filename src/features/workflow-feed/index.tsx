import { type ReactNode, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  renderProgress?: (row: WorkflowRow) => ReactNode
  renderControlNumber?: (row: WorkflowRow) => ReactNode
  showDate?: boolean
  progressHeader?: string
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
  renderProgress,
  renderControlNumber,
  showDate = true,
  progressHeader = 'Progress',
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
      ...(renderProgress
        ? [
            {
              id: 'progress',
              header: progressHeader,
              cell: ({ row }: { row: { original: WorkflowRow } }) =>
                renderProgress(row.original),
            } satisfies ColumnDef<WorkflowRow>,
          ]
        : []),
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) =>
          renderStatus ? renderStatus(row.original) : row.original.status,
      },
      ...(renderControlNumber
        ? [
            {
              id: 'control_number',
              header: 'Control number',
              cell: ({ row }: { row: { original: WorkflowRow } }) =>
                renderControlNumber(row.original),
            } satisfies ColumnDef<WorkflowRow>,
          ]
        : []),
      ...(showDate
        ? [
            {
              accessorKey: 'date',
              header: 'Date',
              cell: ({ row }) =>
                row.original.date ? formatDate(row.original.date) : '—',
            } satisfies ColumnDef<WorkflowRow>,
          ]
        : []),
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
      renderControlNumber,
      renderProgress,
      progressHeader,
      renderStatus,
      showDate,
      onAction,
      permissionForRow,
    ]
  )

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
