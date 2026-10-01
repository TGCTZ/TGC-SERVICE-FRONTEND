import { type Row, flexRender } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { columnLabel } from './column-label'

type DataTableCardListProps<T> = {
  rows: Row<T>[]
  /** Running serial number for the first row, from the server's pagination. */
  offset: number
  onRowClick?: (row: T) => void
  isRowDeleted?: (row: T) => boolean
}

/**
 * The mobile rendering of a table: one card per row, fields stacked.
 *
 * A table with eight columns does not become usable on a 360px screen by
 * scrolling sideways — the row you are reading leaves the viewport before you
 * reach the column you want, and the header scrolls away with it, so the
 * values lose their labels. Stacking each row into a labelled card keeps every
 * field readable without horizontal travel.
 *
 * This renders the *same* `columnDef.cell` functions as the table, so a
 * feature's formatting, badges and truncation carry over untouched and cannot
 * drift between the two views.
 *
 * Two columns are treated structurally rather than as fields:
 *
 * - `sn` — the serial number, which belongs in the card's corner, not in a
 *   labelled row of its own
 * - `actions` — the row menu, pinned to the card header where it stays at a
 *   predictable thumb position across cards
 *
 * Anything with `meta.hideOnMobile` is dropped entirely.
 */
export function DataTableCardList<T>({
  rows,
  offset,
  onRowClick,
  isRowDeleted,
}: DataTableCardListProps<T>) {
  return (
    <ul className='space-y-3'>
      {rows.map((row, index) => {
        const cells = row.getVisibleCells()
        const actionCell = cells.find((cell) => cell.column.id === 'actions')
        const fieldCells = cells.filter(
          (cell) =>
            cell.column.id !== 'actions' &&
            cell.column.id !== 'sn' &&
            !cell.column.columnDef.meta?.hideOnMobile
        )

        const deleted = isRowDeleted?.(row.original) ?? false

        return (
          <li key={row.id}>
            <div
              // The card is only a button when there is somewhere to go;
              // otherwise it must not advertise a tap target or take focus.
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      // Space would otherwise scroll the page out from under
                      // the card the user just activated.
                      event.preventDefault()
                      onRowClick(row.original)
                    }
                  : undefined
              }
              className={cn(
                'rounded-md border bg-card p-4 text-sm',
                onRowClick &&
                  'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:bg-accent/50',
                // Matches the table's treatment of soft-deleted rows.
                deleted &&
                  'border-s-2 border-s-destructive bg-destructive/5 text-muted-foreground'
              )}
            >
              <div className='mb-3 flex items-center justify-between gap-2'>
                <span className='text-xs text-muted-foreground tabular-nums'>
                  #{offset + index + 1}
                </span>
                {actionCell && (
                  <div className='-me-2 shrink-0'>
                    {flexRender(
                      actionCell.column.columnDef.cell,
                      actionCell.getContext()
                    )}
                  </div>
                )}
              </div>

              <dl className='space-y-2'>
                {fieldCells.map((cell) => (
                  <div
                    key={cell.id}
                    className='grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] items-start gap-2'
                  >
                    <dt className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
                      {columnLabel(cell.column)}
                    </dt>
                    <dd className='min-w-0 break-words'>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
