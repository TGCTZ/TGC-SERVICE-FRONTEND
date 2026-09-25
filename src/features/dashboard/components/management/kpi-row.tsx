import { type UseQueryResult } from '@tanstack/react-query'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type Summary } from '../../data/analytics'
import {
  formatCount,
  formatMoney,
  formatPercent,
  relativeChange,
} from '../../data/format'

/**
 * The headline figures for the period, each against the one before it.
 *
 * Revenue shows the lab's own currency first: amounts in different
 * currencies are listed, never added.
 */
export function KpiRow({ query }: { query: UseQueryResult<Summary> }) {
  const data = query.data
  const stale = query.isPlaceholderData

  if (query.isPending) {
    return (
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)]'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-28 w-full rounded-xl' />
        ))}
      </div>
    )
  }
  if (!data) {
    return (
      <p className='text-sm text-muted-foreground'>
        The headline figures could not be loaded.
      </p>
    )
  }

  const [revenue, ...otherRevenue] = leadWithShillings(data.revenue_collected)
  const [owed, ...otherOwed] = leadWithShillings(data.outstanding)
  const longOverdue = owed?.aging[owed.aging.length - 1]

  return (
    <div
      className={cn(
        'grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)]',
        stale && 'opacity-60'
      )}
    >
      <StatTile
        label='Stones received'
        value={formatCount(data.stones_received.current)}
        change={relativeChange(
          data.stones_received.current,
          data.stones_received.previous
        )}
      />
      <StatTile
        label='Certificates issued'
        value={formatCount(data.certificates_issued.current)}
        change={relativeChange(
          data.certificates_issued.current,
          data.certificates_issued.previous
        )}
      />
      <StatTile
        label='Revenue collected'
        value={revenue ? formatMoney(revenue.current, revenue.currency) : '—'}
        change={
          revenue ? relativeChange(revenue.current, revenue.previous) : null
        }
        note={otherRevenue
          .map((row) => `+ ${formatMoney(row.current, row.currency)}`)
          .join(' · ')}
      />
      <StatTile
        label='Outstanding now'
        value={owed ? formatMoney(owed.amount, owed.currency) : '—'}
        note={[
          owed
            ? `${owed.bills} open ${owed.bills === 1 ? 'bill' : 'bills'}`
            : 'No open bills',
          longOverdue?.amount
            ? `${formatMoney(longOverdue.amount, owed.currency)} ${longOverdue.label.toLowerCase()}`
            : '',
          ...otherOwed.map(
            (row) => `+ ${formatMoney(row.amount, row.currency)}`
          ),
        ]
          .filter(Boolean)
          .join(' · ')}
      />
    </div>
  )
}

/** Rows with a currency, TZS first - the lab's own - then alphabetical. */
function leadWithShillings<T extends { currency: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      Number(b.currency === 'TZS') - Number(a.currency === 'TZS') ||
      a.currency.localeCompare(b.currency)
  )
}

function StatTile({
  label,
  value,
  change,
  note,
}: {
  label: string
  value: string
  /** Relative change on the previous period; omit for as-of-now figures. */
  change?: number | null
  note?: string
}) {
  return (
    <Card className='gap-2 py-5'>
      <CardHeader className='px-5'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-1 px-5'>
        {/* Proportional figures: tabular digits look loose at this size. */}
        <div className='text-2xl font-semibold break-words'>{value}</div>
        {change !== undefined && <Delta change={change} />}
        {note && <p className='text-xs text-muted-foreground'>{note}</p>}
      </CardContent>
    </Card>
  )
}

/**
 * The change, signed, with an arrow as well as a colour - colour alone would
 * say nothing to a colour-blind reader or on a black-and-white print.
 */
function Delta({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <p className='text-xs text-muted-foreground'>
        No earlier figure to compare
      </p>
    )
  }

  const flat = Math.abs(change) < 0.0005
  const good = flat ? null : change > 0
  const Icon = flat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight

  return (
    <p className='flex items-center gap-1 text-xs'>
      <span
        className={cn(
          'flex items-center gap-0.5 font-medium',
          good === null && 'text-muted-foreground',
          good === true && 'text-success-text',
          good === false && 'text-danger-text'
        )}
      >
        <Icon className='size-3.5' aria-hidden />
        {change > 0 ? '+' : ''}
        {formatPercent(change)}
      </span>
      <span className='text-muted-foreground'>vs previous period</span>
    </p>
  )
}
