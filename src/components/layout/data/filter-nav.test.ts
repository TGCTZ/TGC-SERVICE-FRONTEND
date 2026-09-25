import { describe, expect, it } from 'vitest'
import { PERMISSIONS, perm } from '@/lib/permissions'
import { type NavGroup } from '../types'
import { filterNavGroups } from './filter-nav'
import { sidebarData } from './sidebar-data'

const billing: NavGroup = {
  title: 'Billing',
  permission: 'core.module_billing',
  items: [
    { title: 'Bills', url: '/bills', permission: 'billing.view_bill' },
    { title: 'Payments', url: '/payments', permission: 'billing.view_payment' },
  ],
}

const titles = (groups: NavGroup[]) => groups.map((group) => group.title)

describe('filterNavGroups', () => {
  it('hides a gated group without its gate, even with every item permission', () => {
    // The point of the gate: an admin hides a section from a role without
    // stripping the model permissions its pages need.
    const granted = ['billing.view_bill', 'billing.view_payment']

    expect(filterNavGroups([billing], granted)).toEqual([])
  })

  it('still filters the items inside a gated group', () => {
    const granted = ['core.module_billing', 'billing.view_bill']

    const [group] = filterNavGroups([billing], granted)

    expect(group.items.map((item) => item.title)).toEqual(['Bills'])
  })

  it('never shows an empty heading just because the gate is held', () => {
    expect(filterNavGroups([billing], ['core.module_billing'])).toEqual([])
  })

  it('accepts any one of several gates', () => {
    const shared = {
      ...billing,
      permission: ['core.module_user', 'core.module_billing'],
    }
    const granted = ['core.module_billing', 'billing.view_bill']

    expect(titles(filterNavGroups([shared], granted))).toEqual(['Billing'])
  })

  it('leaves an ungated group to its items', () => {
    const overview: NavGroup = {
      title: 'Overview',
      items: [{ title: 'Dashboard', url: '/' }],
    }

    expect(titles(filterNavGroups([overview], []))).toEqual(['Overview'])
  })
})

describe('sidebar module gates', () => {
  it('keeps the bench from a receptionist who can view orders', () => {
    // Identification is reached through orders.view_order, so before the gates
    // this set of permissions also surfaced the whole Gemmology Lab group.
    const receptionist = [
      perm('customers', 'view'),
      perm('orders', 'view'),
      PERMISSIONS.moduleOrders,
    ]

    expect(
      titles(filterNavGroups(sidebarData.navGroups, receptionist))
    ).toEqual(['Overview', 'Operations'])
  })

  it('gates each Administration section on its own module', () => {
    const canManageUsers = [perm('users', 'view'), perm('roles', 'view')]

    expect(
      titles(filterNavGroups(sidebarData.navGroups, canManageUsers))
    ).toEqual(['Overview'])

    const [, admin] = filterNavGroups(sidebarData.navGroups, [
      ...canManageUsers,
      PERMISSIONS.moduleUser,
    ])

    expect(admin.title).toBe('Administration')
    expect(admin.items.map((item) => item.title)).toEqual(['Users'])
  })
})
