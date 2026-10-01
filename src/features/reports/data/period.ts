import { z } from 'zod'

const isoDay = z.iso.date()

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
  const today = new Date(`${labToday(now)}T00:00:00Z`)
  const start = new Date(today)
  const end = new Date(today)
  const preset = String(search.range ?? 'month')
  if (['7d', '30d', '90d'].includes(preset)) {
    start.setUTCDate(start.getUTCDate() - Number(preset.slice(0, -1)) + 1)
  } else if (preset === '12m') {
    start.setUTCDate(1)
    start.setUTCMonth(start.getUTCMonth() - 11)
  } else if (preset === 'ytd') {
    start.setUTCMonth(0, 1)
  } else if (preset === 'fy' || preset === 'last-fy') {
    start.setUTCFullYear(
      start.getUTCFullYear() - (start.getUTCMonth() < 6 ? 1 : 0),
      6,
      1
    )
    if (preset === 'last-fy') {
      end.setTime(start.getTime())
      end.setUTCDate(0)
      start.setUTCFullYear(start.getUTCFullYear() - 1)
    }
  } else if (preset === 'last-month') {
    start.setUTCDate(1)
    end.setUTCDate(0)
    start.setUTCMonth(start.getUTCMonth() - 1)
  } else {
    start.setUTCDate(1)
  }
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  }
}

/** Valid ISO dates compare chronologically without browser-local date conversion. */
export function periodProblem(from: string, to: string) {
  if (!isoDay.safeParse(from).success || !isoDay.safeParse(to).success)
    return 'Choose a valid start and end date.'
  if (from > to) return 'The start date must be on or before the end date.'
  return null
}
