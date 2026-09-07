import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * A data table, wrapped in its own horizontal scroll container.
 *
 * The wrapper is why a wide table scrolls sideways instead of forcing the
 * whole page to. Do not add `overflow` to a parent expecting to control
 * this — you will get two scrollbars.
 *
 * For anything server-driven use `components/data-table/`, which owns paging,
 * sorting and filtering. Reach for this primitive only for static tables.
 */
function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot='table-container'
      className='relative w-full overflow-x-auto'
    >
      <table
        data-slot='table'
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

/**
 * The header band.
 *
 * Filled rather than merely underlined: with only a bottom border it read as
 * another data row. Styled on the primitive so hand-rolled tables (roles)
 * match the shared `<DataTable>` ones.
 */
function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot='table-header'
      className={cn(
        'bg-table-header [&_tr]:border-b [&_tr]:hover:bg-table-header',
        className
      )}
      {...props}
    />
  )
}

/** The table body. Drops the border on the final row. */
function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot='table-body'
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

/** A summary row region, for totals. */
function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot='table-footer'
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  )
}

/** A table row, with hover and selected states. */
function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot='table-row'
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
}

/** A header cell. Uppercase with widened tracking; `whitespace-nowrap` so headings do not wrap mid-word. */
function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        // Uppercase with widened tracking: at this size the letterforms run
        // together without it. `text-xs` compensates for caps reading larger.
        'h-11 px-2 text-start align-middle text-xs font-semibold tracking-wider whitespace-nowrap text-foreground uppercase *:[[role=checkbox]]:translate-y-0.5',
        className
      )}
      {...props}
    />
  )
}

/** A data cell. `whitespace-nowrap`, so columns stay legible and the table scrolls instead of squeezing. */
function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot='table-cell'
      className={cn(
        'p-2 align-middle whitespace-nowrap *:[[role=checkbox]]:translate-y-0.5',
        className
      )}
      {...props}
    />
  )
}

/** A caption below the table, describing its contents to screen readers. */
function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot='table-caption'
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
