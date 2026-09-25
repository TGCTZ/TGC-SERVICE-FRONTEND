import { describe, expect, it } from 'vitest'
import {
  customRangeProblem,
  periodFromSearch,
  rangeFromPreset,
} from './analytics'
import {
  formatAmount,
  formatCount,
  formatDays,
  formatMoney,
  formatPercent,
  formatPeriod,
  relativeChange,
} from './format'

const TODAY = new Date(2026, 8, 25) // 25 September 2026, local time

describe('rangeFromPreset', () => {
  it('counts the rolling windows inclusively, ending today', () => {
    expect(rangeFromPreset('30d', TODAY)).toEqual({
      from: '2026-08-27',
      to: '2026-09-25',
    })
    expect(rangeFromPreset('90d', TODAY).from).toBe('2026-06-28')
  })

  it('opens twelve months on the 1st, so the first monthly bar is whole', () => {
    expect(rangeFromPreset('12m', TODAY).from).toBe('2025-10-01')
  })

  it('opens the year to date on 1 January', () => {
    expect(rangeFromPreset('ytd', TODAY).from).toBe('2026-01-01')
  })

  it('takes last month whole, ending before today', () => {
    expect(rangeFromPreset('last-month', TODAY)).toEqual({
      from: '2026-08-01',
      to: '2026-08-31',
    })
  })

  it('runs the financial year from 1 July, as the government does', () => {
    expect(rangeFromPreset('fy', TODAY)).toEqual({
      from: '2026-07-01',
      to: '2026-09-25',
    })
    expect(rangeFromPreset('last-fy', TODAY)).toEqual({
      from: '2025-07-01',
      to: '2026-06-30',
    })
    // Before July, "this" financial year began the July before.
    expect(rangeFromPreset('fy', new Date(2026, 2, 10)).from).toBe('2025-07-01')
  })
})

describe('periodFromSearch', () => {
  it('reads a custom range when both dates are there and usable', () => {
    expect(
      periodFromSearch({ from: '2026-02-01', to: '2026-03-15' }, TODAY)
    ).toEqual({ preset: 'custom', from: '2026-02-01', to: '2026-03-15' })
  })

  it('falls back to the preset, or the default, on a bad pair', () => {
    expect(
      periodFromSearch(
        { range: '30d', from: '2026-03-15', to: '2026-02-01' },
        TODAY
      ).preset
    ).toBe('30d')
    expect(periodFromSearch({ from: '2026-02-01' }, TODAY).preset).toBe('12m')
  })
})

describe('customRangeProblem', () => {
  it('refuses a backwards range and one longer than the API allows', () => {
    const day = (text: string) => new Date(`${text}T00:00:00`)
    expect(customRangeProblem(day('2026-02-01'), day('2026-02-01'))).toBeNull()
    expect(customRangeProblem(day('2026-02-02'), day('2026-02-01'))).toMatch(
      /start/
    )
    expect(customRangeProblem(day('2022-01-01'), day('2026-01-01'))).toMatch(
      /three years/
    )
  })
})

describe('formatMoney', () => {
  // Intl separates the code from the number with a no-break space; \s matches it.
  it('keeps every amount in its own currency', () => {
    expect(formatMoney(1_250_000, 'TZS')).toMatch(/^TZS\s1,250,000$/)
    expect(formatMoney(40.5, 'USD')).toMatch(/^USD\s40\.50$/)
  })

  it('writes amounts out in full, never as 1.3M', () => {
    expect(formatMoney(70_000, 'TZS')).toMatch(/^TZS\s70,000$/)
    expect(formatMoney(12_345_678, 'TZS')).toMatch(/^TZS\s12,345,678$/)
    expect(formatAmount(12_345_678.4)).toBe('12,345,678')
    expect(formatCount(12_905)).toBe('12,905')
  })

  it('survives a currency code Intl does not know', () => {
    expect(formatMoney(5, 'NOT-A-CODE')).toBe('NOT-A-CODE 5')
  })
})

describe('the other formatters', () => {
  it('keeps a decimal on small percentages so 0.4% is not 0%', () => {
    expect(formatPercent(0.004)).toBe('0.4%')
    expect(formatPercent(0.25)).toBe('25%')
    expect(formatPercent(null)).toBe('—')
  })

  it('reports no change where there is nothing to compare', () => {
    expect(relativeChange(12, 10)).toBeCloseTo(0.2)
    expect(relativeChange(5, 0)).toBeNull()
    expect(relativeChange(null, 3)).toBeNull()
  })

  it('writes days and periods the way a reader says them', () => {
    expect(formatDays(4.52)).toBe('4.5 days')
    expect(formatDays(0.4)).toBe('10 hours')
    expect(formatDays(0.01)).toBe('under an hour')
    expect(formatDays(null)).toBe('—')
    expect(formatPeriod('2026-01-01', 'month')).toBe('Jan 26')
    expect(formatPeriod('2026-01-05', 'week')).toBe('5 Jan')
  })
})
