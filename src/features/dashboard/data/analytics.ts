import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns'
import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * The ready-made periods, grouped as the picker lists them: rolling windows,
 * calendar periods, then the government financial year.
 *
 * A preset is stored in the URL by name rather than as dates, so a link to
 * "last 30 days" still means the last 30 days when it is opened next month.
 */
export const RANGE_GROUPS = [
  ['7d', '30d', '90d', '12m'],
  ['month', 'last-month', 'ytd'],
  ['fy', 'last-fy'],
] as const
export const RANGE_PRESETS = [
  '7d',
  '30d',
  '90d',
  '12m',
  'month',
  'last-month',
  'ytd',
  'fy',
  'last-fy',
] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]
export const DEFAULT_RANGE: RangePreset = '12m'

export const RANGE_LABELS: Record<RangePreset, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '12m': 'Last 12 months',
  month: 'This month',
  'last-month': 'Last month',
  ytd: 'Year to date',
  fy: 'This financial year',
  'last-fy': 'Last financial year',
}

/**
 * Longest range the API accepts - `MAX_DAYS` in apps/analytics/periods.py.
 * Checked here too, so the picker can say so before a request fails.
 */
export const MAX_RANGE_DAYS = 3 * 366

/** Inclusive `yyyy-MM-dd` dates, as the statistics endpoints take them. */
export type DateRange = { from: string; to: string }

/** The period on screen: a named preset, or dates someone picked. */
export type Period = DateRange & { preset: RangePreset | 'custom' }

/** What the picker hands back: a preset, or a custom pair of dates. */
export type PeriodChoice = { preset: RangePreset } | DateRange

const iso = (day: Date) => format(day, 'yyyy-MM-dd')

/**
 * The first day of the financial year `day` falls in.
 *
 * Tanzania's government financial year runs 1 July to 30 June, and the
 * lab reports to the Ministry on it.
 */
function financialYearStart(day: Date): Date {
  const year = day.getMonth() >= 6 ? day.getFullYear() : day.getFullYear() - 1
  return new Date(year, 6, 1)
}

/**
 * The dates a preset covers.
 *
 * Rolling windows and the "this ..." periods end today; "last month" and
 * "last financial year" are whole periods that ended before it. "Last 12
 * months" starts on the 1st so a monthly chart opens on a whole first bar,
 * matching the API's own default.
 */
export function rangeFromPreset(
  preset: RangePreset,
  today: Date = new Date()
): DateRange {
  const fyStart = financialYearStart(today)
  const [start, end] = {
    '7d': [subDays(today, 6), today],
    '30d': [subDays(today, 29), today],
    '90d': [subDays(today, 89), today],
    '12m': [startOfMonth(subMonths(today, 11)), today],
    month: [startOfMonth(today), today],
    'last-month': [
      startOfMonth(subMonths(today, 1)),
      endOfMonth(subMonths(today, 1)),
    ],
    ytd: [startOfYear(today), today],
    fy: [fyStart, today],
    'last-fy': [subYears(fyStart, 1), subDays(fyStart, 1)],
  }[preset]
  return { from: iso(start), to: iso(end) }
}

/**
 * Why a custom range cannot be used, or null when it can.
 *
 * @param from - First day, inclusive.
 * @param to - Last day, inclusive.
 */
export function customRangeProblem(from: Date, to: Date): string | null {
  if (!isValid(from) || !isValid(to)) return 'Pick a start and an end date.'
  if (from > to) return 'The start must be on or before the end.'
  if (differenceInCalendarDays(to, from) + 1 > MAX_RANGE_DAYS) {
    return 'A range can cover at most three years.'
  }
  return null
}

/**
 * The period a dashboard URL describes.
 *
 * `from` and `to` win when both are present and usable; otherwise the named
 * preset, or the default. A hand-edited URL with a backwards range falls back
 * rather than showing an error page for a typo.
 */
export function periodFromSearch(
  search: { range?: RangePreset; from?: string; to?: string },
  today: Date = new Date()
): Period {
  if (search.from && search.to) {
    const from = parseISO(search.from)
    const to = parseISO(search.to)
    if (customRangeProblem(from, to) === null) {
      return { preset: 'custom', from: iso(from), to: iso(to) }
    }
  }
  const preset = search.range ?? DEFAULT_RANGE
  return { preset, ...rangeFromPreset(preset, today) }
}

// ---------------------------------------------------------------- types ---
// Mirrors apps/analytics/selectors.py; amounts are numbers per currency.

export type Granularity = 'day' | 'week' | 'month'
export type RangeInfo = DateRange & { granularity: Granularity }
export type Comparison<T = number> = { current: T; previous: T }
export type Distribution = {
  median: number | null
  average: number | null
  p90: number | null
}
export type Ranked = { name: string; count: number }

export type Outstanding = {
  currency: string
  amount: number
  bills: number
  aging: { label: string; amount: number; bills: number }[]
  expired_amount: number
  expired_bills: number
}

export type Summary = {
  range: RangeInfo
  previous_range: RangeInfo
  stones_received: Comparison
  certificates_issued: Comparison
  revenue_collected: { currency: string; current: number; previous: number }[]
  outstanding: Outstanding[]
}

export type VolumePoint = {
  period: string
  orders: number
  stones: number
  certificates: number
  new_customers: number
  returning_customers: number
}

export type Volume = {
  range: RangeInfo
  series: VolumePoint[]
  totals: Omit<VolumePoint, 'period'>
  orders_on_hold: number
  orders_cancelled: number
  hold_rate: number | null
  cancel_rate: number | null
  certificates_revoked: number
}

export type CurrencyRevenue = {
  currency: string
  collected: number
  billed: number
  collection_rate: number | null
  average_fee_per_stone: number | null
  series: { period: string; collected: number; billed: number }[]
  outstanding: Outstanding | null
}

export type Revenue = {
  range: RangeInfo
  by_currency: CurrencyRevenue[]
  payment_lag_days: Distribution
  channels: Ranked[]
  unprocessed_payments: number
}

export type Stage = {
  key: string
  label: string
  median_days: number | null
  average_days: number | null
  stones: number
}

export type AgingRow = {
  key: string
  label: string
  total: number
  /** Age bands cut around the usual 1-3 day job; see AGE_BUCKETS in selectors.py. */
  buckets: {
    label: string
    count: number
    status: 'normal' | 'watch' | 'late'
  }[]
}

export type Turnaround = {
  range: RangeInfo
  certified_stones: number
  turnaround_days: Distribution
  series: { period: string; median_days: number | null; stones: number }[]
  stages: Stage[]
  aging: AgingRow[]
  workload: { reports: Ranked[]; certificates: Ranked[] }
}

export type Market = {
  range: RangeInfo
  reports: number
  species: Ranked[]
  varieties: Ranked[]
  origins: Ranked[]
  nature: Ranked[]
  treatments: Ranked[]
  stone_types: Ranked[]
  regions: Ranked[]
}

type Sections = {
  summary: Summary
  volume: Volume
  revenue: Revenue
  turnaround: Turnaround
  market: Market
}

/**
 * One section of the statistics for a range.
 *
 * `keepPreviousData` so switching the period holds the charts at the old
 * figures (dimmed) until the new ones land, instead of flashing skeletons.
 *
 * @param section - Which endpoint under `/analytics/`.
 * @param range - The inclusive dates to cover.
 */
export const analyticsQuery = <K extends keyof Sections>(
  section: K,
  range: DateRange
) =>
  queryOptions({
    queryKey: ['analytics', section, range],
    // Aggregates over months move slowly; five minutes keeps tab-hopping cheap.
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<Sections[K]> => {
      const res = await api.get(`/analytics/${section}/`, { params: range })
      return res.data
    },
  })
