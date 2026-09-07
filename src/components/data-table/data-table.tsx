import { useMemo, useState } from 'react'
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { type Meta } from '@/lib/api-query'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from './pagination'
import { DataTableViewOptions } from './view-options'

/** The table state every server-driven list shares. */
export type TableQueryState = {
  page: number
  perPage: number
  search: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

type DataTableProps<T> = {
  columns: ColumnDef<T>[]
  data: T[]
  meta?: Meta
  isFetching: boolean
  state: TableQueryState
  onStateChange: (next: Partial<TableQueryState>) => void
  /** Opens the row's detail view. Omit for tables with nothing to view. */
  onRowClick?: (row: T) => void
  /** True for soft-deleted rows, which render dimmed. */
  isRowDeleted?: (row: T) => boolean
  /** Filter controls rendered to the left of the column-visibility menu. */
  toolbar?: React.ReactNode
  emptyMessage?: string
  /** Prepend a running row number. On by default. */
  showSerialNumber?: boolean
}

/**
 * Server-driven data table shared by every list screen.
 *
 * Paging, sorting and filtering are delegated to the API (the `manual*` flags
 * below): the datasets are far larger than one page, so the table renders only
 * what the server returned and reports intent back through `onStateChange`.
 *
 * Extracted because eight screens need identical behaviour - notably the
 * row-click affordance, which is easy to implement subtly differently (or to
 * forget to guard) if each table hand-rolls it.
 */
export function DataTable<T extends { id: number }>({
  columns,
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  onRowClick,
  isRowDeleted,
  toolbar,
  emptyMessage = 'No results found.',
  showSerialNumber = true,
}: DataTableProps<T>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  /**
   * The serial number is injected here rather than declared per feature.
   *
   * It has to be derived from the *server's* pagination to keep counting
   * across pages (page 2 starts at 11, not 1), and that is exactly the sort of
   * arithmetic each table would otherwise get subtly wrong on its own.
   */
  const allColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!showSerialNumber) return columns

    const offset = meta ? (meta.current_page - 1) * meta.per_page : 0

    const serialColumn: ColumnDef<T> = {
      id: 'sn',
      header: () => <span className='text-muted-foreground'>#</span>,
      cell: ({ row }) => (
        <span className='text-muted-foreground tabular-nums'>
          {offset + row.index + 1}
        </span>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 48,
    }

    return [serialColumn, ...columns]
  }, [columns, meta, showSerialNumber])

  const sorting: SortingState = state.sortBy
    ? [{ id: state.sortBy, desc: state.sortDir === 'desc' }]
    : []

  const table = useReactTable({
    data,
    columns: allColumns,
    // -1 tells TanStack the count is unknown until the first response lands.
    pageCount: meta?.last_page ?? -1,
    state: {
      sorting,
      columnVisibility,
      pagination: { pageIndex: state.page - 1, pageSize: state.perPage },
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const first = next[0]

      onStateChange({
        sortBy: first?.id,
        sortDir: first ? (first.desc ? 'desc' : 'asc') : undefined,
        page: 1,
      })
    },
    onPaginationChange: (updater) => {
      const current = { pageIndex: state.page - 1, pageSize: state.perPage }
      const next = typeof updater === 'function' ? updater(current) : updater

      onStateChange({ page: next.pageIndex + 1, perPage: next.pageSize })
    },
  })

  /**
   * Open the row unless the click landed on something interactive.
   *
   * Without this guard, clicking the actions button or a link inside a cell
   * would also open the detail view behind the menu that just opened.
   */
  function handleRowClick(event: React.MouseEvent, row: T) {
    if (!onRowClick) return

    const target = event.target as HTMLElement
    if (
      target.closest('button, a, input, [role="menuitem"], [role="checkbox"]')
    ) {
      return
    }

    onRowClick(row)
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        {toolbar}
        <div className='ms-auto'>
          <DataTableViewOptions table={table} />
        </div>
      </div>

      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isFetching && data.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={allColumns.length}>
                    <Skeleton className='h-8 w-full' />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    // Deleted rows read as a warning, not as "loading". A tint
                    // plus a start-edge marker survives both themes, where a
                    // plain opacity drop just looks like a rendering glitch.
                    isRowDeleted?.(row.original) &&
                      'border-s-2 border-s-destructive bg-destructive/5 text-muted-foreground hover:bg-destructive/10'
                  )}
                  onClick={(event) => handleRowClick(event, row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className='h-24 text-center'
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
