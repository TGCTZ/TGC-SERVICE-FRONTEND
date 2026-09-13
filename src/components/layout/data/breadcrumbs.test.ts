import { describe, expect, it } from 'vitest'
import { resolveBreadcrumbs } from './breadcrumbs'

/** The labels only — the shape most assertions care about. */
const labels = (pathname: string) =>
  resolveBreadcrumbs(pathname).map((crumb) => crumb.label)

describe('resolveBreadcrumbs', () => {
  it('names the dashboard once', () => {
    // `/` IS the dashboard, so `Home > Overview > Dashboard` would say it three
    // times. The single crumb is also unlinked: it is the current page.
    expect(resolveBreadcrumbs('/')).toEqual([{ label: 'Home' }])
  })

  it('walks the nav tree for a top-level page', () => {
    expect(labels('/orders')).toEqual(['Home', 'Operations', 'Orders'])
    expect(labels('/identification')).toEqual([
      'Home',
      'Operations',
      'Identification',
    ])
    expect(labels('/stones')).toEqual(['Home', 'Operations', 'Stones'])
  })

  it('walks two levels for a nested page', () => {
    expect(labels('/lookups/colors')).toEqual([
      'Home',
      'Administration',
      'Reference data',
      'Colours',
    ])
  })

  it('resolves a generated worklist slug without a slug lookup', () => {
    expect(labels('/worklists/findings')).toEqual([
      'Home',
      'Overview',
      'Queues',
      'Awaiting findings',
    ])
  })

  it('links only the ancestors, never the current page', () => {
    const crumbs = resolveBreadcrumbs('/orders')

    expect(crumbs[0].url).toBe('/')
    // Nav groups have no URL of their own, so they are plain text.
    expect(crumbs[1].url).toBeUndefined()
    expect(crumbs[crumbs.length - 1].url).toBeUndefined()
  })

  it('keeps the ancestors of a record below a known page', () => {
    const crumbs = resolveBreadcrumbs('/orders/42')

    expect(crumbs.map((crumb) => crumb.label)).toEqual([
      'Home',
      'Operations',
      'Orders',
      '42',
    ])
    // Orders is no longer the current page, so it becomes navigable.
    expect(crumbs[2].url).toBe('/orders')
  })

  it('humanises a path the sidebar does not know', () => {
    // Settings is absent from the nav on purpose; its slugs already read as
    // titles, so the fallback is the whole answer rather than a degradation.
    expect(labels('/settings/account')).toEqual(['Home', 'Settings', 'Account'])
    expect(labels('/widgets/new-thing')).toEqual([
      'Home',
      'Widgets',
      'New thing',
    ])
  })

  it('ignores a trailing slash, a query and a hash', () => {
    const expected = ['Home', 'Operations', 'Orders']

    expect(labels('/orders/')).toEqual(expected)
    expect(labels('/orders?page=2')).toEqual(expected)
    expect(labels('/orders#top')).toEqual(expected)
  })

  it('never throws and never returns empty', () => {
    expect(labels('')).toEqual(['Home'])
    expect(() => resolveBreadcrumbs('/lookups/%zz')).not.toThrow()
    expect(resolveBreadcrumbs('/lookups/%zz').length).toBeGreaterThan(0)
  })
})
