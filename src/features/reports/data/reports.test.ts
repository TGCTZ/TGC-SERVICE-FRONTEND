import { describe, expect, it } from 'vitest'
import { filterNavGroups } from '@/components/layout/data/filter-nav'
import { sidebarData } from '@/components/layout/data/sidebar-data'
import { firstReportPath } from './config'
import { defaultPeriod, legacyPeriod, periodProblem } from './period'

describe('report navigation', () => {
  it('chooses an accessible home without granting financial access to operations staff', () => {
    expect(firstReportPath(['billing.view_bill'])).toBe('/reports/financial')
    expect(firstReportPath(['billing.view_payment'])).toBe('/reports/financial')
    expect(firstReportPath(['orders.view_order'])).toBe('/reports/operational')
    expect(firstReportPath(['orders.view_order', 'billing.view_payment'])).toBe(
      '/reports/financial'
    )
    expect(firstReportPath([])).toBe('/403')
  })

  it('shows exactly two report items, filters them, and retires Overview and Dashboard', () => {
    const reports = sidebarData.navGroups.find(
      (group) => group.title === 'Reports'
    )!
    expect(reports.items.map((item) => item.title)).toEqual([
      'Financial reports',
      'Operational reports',
    ])
    expect(
      sidebarData.navGroups.some((group) => group.title === 'Overview')
    ).toBe(false)
    expect(
      sidebarData.navGroups
        .flatMap((group) => group.items)
        .some((item) => item.title === 'Dashboard')
    ).toBe(false)
    expect(filterNavGroups([reports], []).length).toBe(0)
    expect(
      filterNavGroups([reports], ['orders.view_stone'])[0].items.map(
        (item) => item.title
      )
    ).toEqual(['Operational reports'])
    expect(
      sidebarData.navGroups.some((group) => group.title === 'Queues')
    ).toBe(true)
  })
})

describe('report periods', () => {
  it('uses the lab month even before UTC midnight and in a different browser timezone', () => {
    expect(defaultPeriod(new Date('2026-09-30T22:00:00Z'))).toEqual({
      from: '2026-10-01',
      to: '2026-10-01',
    })
  })

  it('preserves valid Management custom ranges and rejects impossible dates', () => {
    expect(
      legacyPeriod({ tab: 'management', from: '2026-08-01', to: '2026-08-31' })
    ).toEqual({ from: '2026-08-01', to: '2026-08-31' })
    expect(periodProblem('2026-02-30', '2026-03-01')).not.toBeNull()
    expect(periodProblem('2026-10-01', '2026-09-30')).not.toBeNull()
    expect(periodProblem('2026-09-01', '2026-09-30')).toBeNull()
  })

  it('preserves old rolling and financial-year bookmark periods', () => {
    const now = new Date('2026-09-30T12:00:00Z')
    expect(legacyPeriod({ range: '7d' }, now)).toEqual({
      from: '2026-09-24',
      to: '2026-09-30',
    })
    expect(legacyPeriod({ range: 'last-fy' }, now)).toEqual({
      from: '2025-07-01',
      to: '2026-06-30',
    })
    expect(legacyPeriod({ range: 'last-month' }, now)).toEqual({
      from: '2026-08-01',
      to: '2026-08-31',
    })
  })
})
