import { describe, expect, it } from 'vitest'
import { PERMISSIONS } from '@/lib/permissions'
import { landingPath } from './landing'

describe('login landing page', () => {
  it('sends each workflow role to its work page', () => {
    expect(landingPath(['receptionist'], [])).toBe('/orders')
    expect(landingPath(['gemmologist'], [])).toBe('/identification')
    expect(landingPath(['accountant'], [])).toBe('/bills')
  })

  it('sends other roles to operational reports when they can access them', () => {
    expect(
      landingPath(
        ['manager'],
        [
          PERMISSIONS.moduleReports,
          PERMISSIONS.operationalReports,
          'orders.view_order',
        ]
      )
    ).toBe('/reports/operational')
    expect(landingPath(['custom'], [])).toBe('/403')
  })
})
