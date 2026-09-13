import { type NavGroup, type NavLink } from '../types'
import { sidebarData } from './sidebar-data'

/** One step of the trail. `url` is set only where the crumb is navigable. */
export type Crumb = {
  label: string
  url?: NavLink['url']
}

/** A nav leaf paired with the titles standing above it. */
type NavLeaf = {
  /** Kept as the nav type, so `<Link to>` still typechecks. */
  url: NavLink['url']
  /** The same URL as a plain string, for comparison. */
  path: string
  /** Group title, the collapsible's title if there is one, then the leaf's. */
  titles: string[]
}

const HOME = 'Home'

/**
 * Flatten the three-tier nav into one leaf-per-URL list.
 *
 * Reads `sidebarData` **unfiltered**, on purpose. `filterNavGroups` drops a
 * whole group once the user can see none of its items, so filtering here would
 * punch holes in the trail of a page the user can legitimately reach. Nothing
 * leaks by it: every ancestor crumb renders as plain text, not a link.
 */
function flattenNav(groups: NavGroup[]): NavLeaf[] {
  const leaves: NavLeaf[] = []

  for (const group of groups) {
    for (const item of group.items) {
      if ('items' in item && item.items) {
        for (const child of item.items) {
          leaves.push({
            url: child.url,
            path: String(child.url),
            titles: [group.title, item.title, child.title],
          })
        }
        continue
      }

      leaves.push({
        url: item.url,
        path: String(item.url),
        titles: [group.title, item.title],
      })
    }
  }

  return leaves
}

/** Strip query, hash and a trailing slash, so `/orders/` and `/orders` match alike. */
function normalisePath(pathname: string): string {
  const path = pathname.split('?')[0].split('#')[0]
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

/** Turn a URL segment into a label: `shape-cuts` becomes `Shape cuts`. */
function humanise(segment: string): string {
  let text = segment
  try {
    text = decodeURIComponent(segment)
  } catch {
    // A malformed escape is still a perfectly good label as it stands.
  }

  const words = text.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * The full navigation trail for a pathname.
 *
 * The sidebar is the single source of truth for page names, so a screen gets
 * its trail the moment it has a `sidebar-data.ts` entry and can never drift
 * from the menu the user just clicked. Three passes, in order:
 *
 * 1. **Exact leaf match** — `/lookups/colors` resolves to
 *    `Home › Administration › Reference data › Colours`. Every lookup and
 *    worklist URL is already a generated leaf, so slug lookups are not needed.
 * 2. **Deepest prefix match** — a record page such as `/orders/42` keeps its
 *    ancestors and appends the humanised leftovers, with the matched leaf made
 *    clickable since it is no longer the current page.
 * 3. **Humanised path** — `/settings/account` gives `Home › Settings ›
 *    Account`. This is why settings needs no second label source: its own slugs
 *    already read as titles. It is also the safety net for a page nobody added
 *    to the nav, so this function never throws and never returns empty.
 *
 * `/` returns a single plain `Home`: it *is* the dashboard, so
 * `Home › Overview › Dashboard` would name one page three times.
 *
 * Only ancestors carry a `url`; the trail's own page is always plain.
 *
 * @param pathname - `location.pathname`; query and hash are tolerated
 * @returns The trail from `Home` to the current page, never empty
 * @example
 * resolveBreadcrumbs('/orders')
 * // [{ label: 'Home', url: '/' }, { label: 'Reception' }, { label: 'Orders' }]
 */
export function resolveBreadcrumbs(pathname: string): Crumb[] {
  const path = normalisePath(pathname)
  if (path === '/' || path === '') return [{ label: HOME }]

  const home: Crumb = { label: HOME, url: '/' }
  const leaves = flattenNav(sidebarData.navGroups)

  const exact = leaves.find((leaf) => leaf.path === path)
  if (exact) return [home, ...exact.titles.map((label) => ({ label }))]

  const parent = leaves
    .filter((leaf) => leaf.path !== '/' && path.startsWith(`${leaf.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]

  if (parent) {
    const rest = path
      .slice(parent.path.length + 1)
      .split('/')
      .filter(Boolean)

    return [
      home,
      ...parent.titles.slice(0, -1).map((label) => ({ label })),
      { label: parent.titles[parent.titles.length - 1], url: parent.url },
      ...rest.map((segment) => ({ label: humanise(segment) })),
    ]
  }

  return [
    home,
    ...path
      .split('/')
      .filter(Boolean)
      .map((segment) => ({ label: humanise(segment) })),
  ]
}
