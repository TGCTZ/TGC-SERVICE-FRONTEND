import { type LinkProps } from '@tanstack/react-router'
import { type countQuery } from '@/features/dashboard/data/api'

/** A query resolving to the number an entry shows, e.g. a queue's length. */
type NavCount = ReturnType<typeof countQuery>

type BaseNavItem = {
  title: string
  badge?: string
  icon?: React.ElementType
  /**
   * Permission(s) required to see this entry. The user needs at least one.
   * Omit to always show it. Navigation is filtered from the same permission
   * list the API enforces, so the sidebar never offers a page that would 403.
   */
  permission?: string | string[]
  /**
   * A live count shown beside the title — used for the queues, so the sidebar
   * says how much work is waiting without opening each one. Rendered on links
   * only; a collapsible parent is not a page, so it has nothing to count.
   */
  count?: NavCount
}

type NavLink = BaseNavItem & {
  url: LinkProps['to'] | (string & {})
  items?: never
}

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] | (string & {}) })[]
  url?: never
}

type NavItem = NavCollapsible | NavLink

type NavGroup = {
  title: string
  /**
   * Module gate(s) for the whole section, e.g. `core.module_billing`. The user
   * needs at least one; omit to leave the section ungated. Checked on top of
   * each item's own `permission`, never instead of it: a gated group still
   * shows only the items the user can reach, and still vanishes when none are.
   */
  permission?: string | string[]
  items: NavItem[]
}

type SidebarData = {
  navGroups: NavGroup[]
}

/**
 * Navigation types for the sidebar.
 *
 * - `NavLink` — a leaf with a `url`
 * - `NavCollapsible` — a parent with `items`; the two are mutually exclusive,
 *   enforced by the `never` fields, so a typo gives a type error rather than
 *   an entry that silently renders as neither
 * - `NavGroup` — a titled, foldable section, optionally behind a module gate
 * - `SidebarData` — the whole tree
 *
 * @see `./data/sidebar-data.ts` for the three-tier structure and its rationale
 */
export type {
  SidebarData,
  NavGroup,
  NavItem,
  NavCollapsible,
  NavLink,
  NavCount,
}
