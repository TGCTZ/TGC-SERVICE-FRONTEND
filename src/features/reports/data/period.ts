import { z } from 'zod'

const isoDay = z.iso.date()

export const dateRangePresets = [
  { value: 'today', label: 'Today' },
  { value: 'this-month', label: 'This month' },
  { value: 'this-year', label: 'This year' },
  { value: 'this-financial-year', label: 'This financial year' },
  { value: 'last-year', label: 'Last year' },
  { value: 'last-financial-year', label: 'Last financial year' },
] as const

export type DateRangePreset = (typeof dateRangePresets)[number]['value']
type PeriodPreset =
  | DateRangePreset
  | 'last-7-days'
  | 'last-30-days'
  | 'last-90-days'
  | 'last-12-months'
  | 'last-month'
export const dateRangePresetSchema = z.enum(
  dateRangePresets.map(({ value }) => value) as [
    DateRangePreset,
    ...DateRangePreset[],
  ]
)

export const legacySearchSchema = z.object({
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  range: z.string().optional().catch(undefined),
  tab: z.string().optional().catch(undefined),
})

function labToday(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Dar_es_Salaam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (name: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === name)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** Use lab dates even when a user's browser is in another timezone. */
export function defaultPeriod(now = new Date()) {
  const today = labToday(now)
  return { from: `${today.slice(0, 7)}-01`, to: today }
}

function utcDay(date: Date) {
  return date.toISOString().slice(0, 10)
}

/** Resolve a named date range against the report's lab-local calendar day. */
export function periodForPreset(preset: PeriodPreset, now = new Date()) {
  const today = new Date(`${labToday(now)}T00:00:00Z`)
  const year = today.getUTCFullYear()
  const month = today.getUTCMonth()
  let start = new Date(today)
  let end = new Date(today)

  switch (preset) {
    case 'today':
      break
    case 'this-month':
      start = new Date(Date.UTC(year, month, 1))
      break
    case 'this-year':
      start = new Date(Date.UTC(year, 0, 1))
      break
    case 'this-financial-year':
      start = new Date(Date.UTC(year - (month < 6 ? 1 : 0), 6, 1))
      break
    case 'last-7-days':
    case 'last-30-days':
    case 'last-90-days': {
      const days = Number(preset.split('-')[1])
      start.setUTCDate(start.getUTCDate() - days + 1)
      break
    }
    case 'last-12-months':
      start = new Date(Date.UTC(year, month - 11, 1))
      break
    case 'last-month':
      start = new Date(Date.UTC(year, month - 1, 1))
      end = new Date(Date.UTC(year, month, 0))
      break
    case 'last-year':
      start = new Date(Date.UTC(year - 1, 0, 1))
      end = new Date(Date.UTC(year - 1, 11, 31))
      break
    case 'last-financial-year': {
      const financialYear = year - (month < 6 ? 1 : 0)
      start = new Date(Date.UTC(financialYear - 1, 6, 1))
      end = new Date(Date.UTC(financialYear, 6, 0))
      break
    }
  }

  return { from: utcDay(start), to: utcDay(end) }
}

/** Return the matching preset, or `custom` when the user edited either date. */
export function periodPresetForRange(
  from: string,
  to: string,
  now = new Date(),
  preferred?: DateRangePreset
): DateRangePreset | 'custom' {
  if (preferred) {
    const range = periodForPreset(preferred, now)
    if (range.from === from && range.to === to) return preferred
  }
  return (
    dateRangePresets.find((preset) => {
      const range = periodForPreset(preset.value, now)
      return range.from === from && range.to === to
    })?.value ?? 'custom'
  )
}

/** Preserve dates and named periods from old Management bookmarks. */
export function legacyPeriod(
  search: Record<string, unknown>,
  now = new Date()
) {
  if (
    isoDay.safeParse(search.from).success &&
    isoDay.safeParse(search.to).success &&
    String(search.from) <= String(search.to)
  ) {
    return { from: String(search.from), to: String(search.to) }
  }
  const preset = String(search.range ?? 'month')
  const legacyPresets: Record<string, PeriodPreset> = {
    month: 'this-month',
    '7d': 'last-7-days',
    '30d': 'last-30-days',
    '90d': 'last-90-days',
    '12m': 'last-12-months',
    ytd: 'this-year',
    fy: 'this-financial-year',
    'last-fy': 'last-financial-year',
    'last-month': 'last-month',
  }
  return periodForPreset(legacyPresets[preset] ?? 'this-month', now)
}

/** Valid ISO dates compare chronologically without browser-local date conversion. */
export function periodProblem(from: string, to: string) {
  if (!isoDay.safeParse(from).success || !isoDay.safeParse(to).success)
    return 'Choose a valid start and end date.'
  if (from > to) return 'The start date must be on or before the end date.'
  return null
}
