import { useState } from 'react'
import { BarChart3, Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/** The same figures as the chart, as rows: its accessible twin. */
export type TableView = {
  columns: string[]
  rows: React.ReactNode[][]
}

type ChartCardProps = {
  title: string
  description?: string
  /** First load, nothing to show yet. */
  isPending: boolean
  isError: boolean
  /** A new period is loading: the previous figures stay up, dimmed. */
  isStale?: boolean
  /** Loaded, and there is nothing in the period to draw. */
  isEmpty?: boolean
  table: TableView
  /** The chart itself. */
  children: React.ReactNode
  className?: string
}

/**
 * A titled card for one chart, with a table view one click away.
 *
 * The table is not an extra: a tooltip must never be the only way to read a
 * value, colour alone must never carry meaning, and a screen reader cannot
 * read an SVG. Every chart on the Management tab is built on this card so
 * none of them can ship without it.
 */
export function ChartCard({
  title,
  description,
  isPending,
  isError,
  isStale = false,
  isEmpty = false,
  table,
  children,
  className,
}: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const ready = !isPending && !isError && !isEmpty

  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {description && (
          <CardDescription className='text-xs'>{description}</CardDescription>
        )}
        {ready && (
          <CardAction>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-xs text-muted-foreground'
              aria-pressed={view === 'table'}
              onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
            >
              {view === 'chart' ? <Table2 /> : <BarChart3 />}
              {view === 'chart' ? 'Table' : 'Chart'}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent
        className={cn('transition-opacity', isStale && 'opacity-60')}
        aria-busy={isStale || isPending}
      >
        {isPending ? (
          <Skeleton className='h-60 w-full' />
        ) : isError ? (
          <Notice>These figures could not be loaded.</Notice>
        ) : isEmpty ? (
          <Notice>Nothing recorded in this period.</Notice>
        ) : view === 'table' ? (
          <FigureTable {...table} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className='flex h-40 items-center justify-center text-sm text-muted-foreground'>
      {children}
    </p>
  )
}

/** First column is the label; the rest are figures, right-aligned in columns. */
export function FigureTable({ columns, rows }: TableView) {
  return (
    <div className='max-h-72 overflow-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={column} className={cn(index > 0 && 'text-right')}>
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, index) => (
                <TableCell
                  key={index}
                  className={cn(index > 0 && 'text-right tabular-nums')}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
