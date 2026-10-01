import { describe, expect, it } from 'vitest'
import {
  allWorklistConfigs,
  worklistConfigBySlug,
} from '@/features/worklists/data/config'

/**
 * The queue registry.
 *
 * One screen serves all four queues off this config, so a wrong endpoint or
 * row kind does not fail to compile — it renders the wrong columns against the
 * wrong rows, or 404s at runtime. These are pure assertions and cost nothing.
 */
describe('worklist configs', () => {
  it('resolves a queue by its slug and nothing by an unknown one', () => {
    expect(worklistConfigBySlug('billing')?.title).toBe('Ready to bill')
    expect(worklistConfigBySlug('nope')).toBeUndefined()
  })

  it('has unique slugs', () => {
    const slugs = allWorklistConfigs().map((config) => config.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('points each queue at the endpoint that owns it', () => {
    expect(worklistConfigBySlug('identification')?.endpoint).toBe(
      '/orders/worklist'
    )
    expect(worklistConfigBySlug('billing')?.endpoint).toBe('/bills/worklist')
    expect(worklistConfigBySlug('findings')?.endpoint).toBe(
      '/identification-reports/worklist'
    )
    expect(worklistConfigBySlug('certification')?.endpoint).toBe(
      '/certificates/worklist'
    )
  })

  it('knows which queues list orders and which list stones', () => {
    // The row kind selects the column array; getting it wrong would render
    // order columns against stone rows.
    expect(worklistConfigBySlug('identification')?.rowKind).toBe('order')
    expect(worklistConfigBySlug('billing')?.rowKind).toBe('order')
    expect(worklistConfigBySlug('findings')?.rowKind).toBe('stone')
    expect(worklistConfigBySlug('certification')?.rowKind).toBe('stone')
  })

  it('gates the workflow queues on the verb, not on a view permission', () => {
    // Billing and certification endpoints enforce the workflow permission, so
    // gating them on `view` would send users to a 403 they could not predict.
    expect(worklistConfigBySlug('billing')?.permission).toBe(
      'billing.generate_bill'
    )
    expect(worklistConfigBySlug('certification')?.permission).toBe(
      'certificates.issue_certificate'
    )
    expect(worklistConfigBySlug('findings')?.permission).toBe(
      'identification.add_identificationreport'
    )
    expect(worklistConfigBySlug('identification')?.permission).toBe(
      'orders.add_stone'
    )
  })

  it('gives every queue the text the screen needs', () => {
    for (const config of allWorklistConfigs()) {
      expect(config.title).not.toBe('')
      expect(config.description).not.toBe('')
      expect(config.actionLabel).not.toBe('')
      expect(config.emptyMessage).not.toBe('')
    }
  })

  it('gives every queue a search box naming what it searches', () => {
    // The endpoints search the row's own model, so the placeholder differs by
    // row kind - an order is found by its reference or customer, a stone also
    // by its label and type. A queue with no placeholder renders no box, so a
    // missing one is a silently unsearchable queue.
    for (const config of allWorklistConfigs()) {
      expect(config.searchPlaceholder, config.slug).toBeTruthy()
    }

    expect(worklistConfigBySlug('billing')?.searchPlaceholder).toContain(
      'reference'
    )
    expect(worklistConfigBySlug('findings')?.searchPlaceholder).toContain(
      'label'
    )
  })
})
