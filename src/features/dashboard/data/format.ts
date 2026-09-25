import { format, parseISO } from 'date-fns'
import { type Granularity } from './analytics'

const EMPTY = '—'

/*
 * Numbers are written out in full with thousands separators - 1,250,000,
 * never 1.3M. Management reads these figures into reports and reconciles
 * them against the books, and a rounded "70K" cannot be checked against
 * anything.
 */

/** A count in full: 1,284 · 12,905. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)
}

/**
 * A bare amount in full, for axis ticks where the chart's title already
 * names the currency and the code would only crowd the axis.
 */
export function formatAmount(value: number): string {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value)
}

/**
 * An amount in its own currency, in full, never converted: TZS 1,250,000.
 * Shillings carry no cents worth showing; other currencies show two places.
 */
export function formatMoney(amount: number, currency: string): string {
  try {
    // Explicit minimums: left to the currency's default (2 for TZS too),
    // whole shillings would grow ".00".
    const places = currency === 'TZS' ? 0 : 2
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      minimumFractionDigits: places,
      maximumFractionDigits: places,
    }).format(amount)
  } catch {
    // An unrecognised code must not take the dashboard down with it.
    return `${currency} ${formatCount(amount)}`
  }
}

/**
 * A duration: hours under a day, days to one decimal above it, or a dash when
 * there is nothing to measure.
 *
 * The whole job usually takes one to three days, so most stage waits are
 * fractions of a day - "10 hours" says what "0.4 days" makes you work out.
 */
export function formatDays(days: number | null): string {
  if (days === null) return EMPTY
  if (days < 1) {
    const hours = Math.round(days * 24)
    if (hours < 1) return 'under an hour'
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }
  return `${days.toFixed(1)} ${days === 1 ? 'day' : 'days'}`
}

/** A 0–1 rate as a percentage; small ones keep a decimal so 0.4% is not 0%. */
export function formatPercent(rate: number | null): string {
  if (rate === null) return EMPTY
  const percent = rate * 100
  return `${percent.toFixed(percent !== 0 && Math.abs(percent) < 10 ? 1 : 0)}%`
}

/**
 * Relative change from `previous` to `current`, or null when it would not
 * mean anything: no figure on either side, or nothing to grow from.
 */
export function relativeChange(
  current: number | null,
  previous: number | null
): number | null {
  if (current === null || previous === null || previous === 0) return null
  return (current - previous) / previous
}

/** A bucket's first day as an axis label, at the bucket's own grain. */
export function formatPeriod(period: string, granularity: Granularity): string {
  const day = parseISO(period)
  return granularity === 'month' ? format(day, 'MMM yy') : format(day, 'd MMM')
}

/** A bucket's first day in full, for tooltips and tables. */
export function formatPeriodLong(
  period: string,
  granularity: Granularity
): string {
  const day = parseISO(period)
  if (granularity === 'month') return format(day, 'MMMM yyyy')
  if (granularity === 'week') return `Week of ${format(day, 'd MMM yyyy')}`
  return format(day, 'EEE d MMM yyyy')
}

/** An inclusive range as a reader says it: 1 Oct 2025 – 25 Sep 2026. */
export function formatRange(from: string, to: string): string {
  return `${format(parseISO(from), 'd MMM yyyy')} – ${format(parseISO(to), 'd MMM yyyy')}`
}
