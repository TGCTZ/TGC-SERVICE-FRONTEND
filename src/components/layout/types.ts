import { type LinkProps } from '@tanstack/react-router'

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
 * - `NavGroup` — a titled, foldable section
 * - `SidebarData` — the whole tree
 *
 * @see `./data/sidebar-data.ts` for the three-tier structure and its rationale
 */
export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink }
