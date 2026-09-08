import {
  Boxes,
  ChartColumn,
  Factory,
  LayoutDashboard,
  ListChecks,
  Package,
  Ruler,
  ScrollText,
  ShieldCheck,
  Tags,
  TerminalSquare,
  Users,
  Wallet,
} from 'lucide-react'
import { PERMISSIONS, perm } from '@/lib/permissions'
import { type SidebarData } from '../types'

/**
 * Sidebar navigation.
 *
 * Structured in three tiers, because that split holds for any admin app
 * regardless of what it manages:
 *
 *   Overview        A landing view. Rarely more than one entry.
 *   Workspace       The domain — what THIS project is actually for.
 *                   The only tier a new project rewrites.
 *   Administration  Who may use the app, and what it has been doing.
 *                   Users, roles and logs exist in every project, so this
 *                   tier ships ready to use.
 *
 * Finance and Reports sit between Workspace and Administration as scaffolded
 * placeholders — common enough to be worth showing, but pointing at the shared
 * ComingSoon screen rather than pretending to work. Build them or delete them.
 *
 * The example Workspace below is a product catalogue, because that is what the
 * bundled TestAPI serves. Replace its contents wholesale; keep the shape.
 *
 * Two rules worth keeping when you edit this:
 *
 * - Every entry carries the `permission` the API enforces for that resource.
 *   `filterNavGroups` hides entries the user cannot reach, drops a collapsible
 *   once all its children are hidden, and drops a group once it is empty — so
 *   a heading only appears for someone who has something under it.
 * - Group headings roughly track the `module.*` gates the API seeds
 *   (`module.catalog`, `module.user`, `module.audit`). Keeping them aligned
 *   means navigation and authorization cannot drift apart.
 */
export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    /* Workspace — replace this entire group for a new project.          */
    /* ---------------------------------------------------------------- */
    {
      title: 'Workspace',
      items: [
        {
          title: 'Products',
          url: '/products',
          icon: Package,
          permission: perm('products', 'view'),
        },
        {
          // Reference data the domain records select from. Each entry maps to
          // the same generic lookup screen, parameterised by the slug — see
          // `features/lookups/data/config.ts`.
          title: 'Reference data',
          icon: Boxes,
          items: [
            {
              title: 'Categories',
              url: '/lookups/product-categories',
              icon: Boxes,
              permission: perm('product-categories', 'view'),
            },
            {
              title: 'Brands',
              url: '/lookups/brands',
              icon: Factory,
              permission: perm('brands', 'view'),
            },
            {
              title: 'Product statuses',
              url: '/lookups/product-statuses',
              icon: ListChecks,
              permission: perm('product-statuses', 'view'),
            },
            {
              title: 'Units of measure',
              url: '/lookups/unit-of-measures',
              icon: Ruler,
              permission: perm('unit-of-measures', 'view'),
            },
            {
              title: 'Tags',
              url: '/lookups/tags',
              icon: Tags,
              permission: perm('tags', 'view'),
            },
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    /* Scaffolded, not built. Present so the navigation reflects the plan */
    /* — each points at the shared ComingSoon screen. Replace a group's   */
    /* route with a real feature, or delete the group if the project has  */
    /* no use for it.                                                     */
    /* ---------------------------------------------------------------- */
    {
      title: 'Finance',
      items: [
        {
          title: 'Overview',
          url: '/finance',
          icon: Wallet,
        },
      ],
    },
    {
      title: 'Reports',
      items: [
        {
          title: 'Overview',
          url: '/reports',
          icon: ChartColumn,
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    /* Administration — the same in every project. Usually kept as-is.   */
    /* ---------------------------------------------------------------- */
    {
      title: 'Administration',
      items: [
        {
          // Collapsible parent: no `permission` of its own — filterNavGroups
          // drops it automatically once every child is filtered out.
          title: 'Users',
          icon: Users,
          items: [
            {
              title: 'All Users',
              url: '/users',
              icon: Users,
              permission: perm('users', 'view'),
            },
            {
              title: 'Roles',
              url: '/roles',
              icon: ShieldCheck,
              permission: perm('roles', 'view'),
            },
          ],
        },
        {
          title: 'Logs',
          icon: ScrollText,
          items: [
            {
              title: 'Audit Logs',
              url: '/audit-logs',
              icon: ScrollText,
              permission: PERMISSIONS.viewActivityLogs,
            },
            {
              title: 'System Logs',
              url: '/system-logs',
              icon: TerminalSquare,
              permission: PERMISSIONS.viewSystemLogs,
            },
          ],
        },
      ],
    },
  ],
}
