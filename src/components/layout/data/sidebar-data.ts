import {
  Boxes,
  ChartColumn,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  Tags,
  TerminalSquare,
  Users,
  Wallet,
} from 'lucide-react'
import { PERMISSIONS, perm } from '@/lib/permissions'
import { allLookupConfigs } from '@/features/lookups/data/config'
import { type NavLink, type SidebarData } from '../types'

/**
 * Sidebar navigation.
 *
 * The groups follow the stone's journey through the lab — reception, billing,
 * the bench, certification — then the reference data those stages draw on, then
 * administration. Each maps onto one of the API's `core.module_*` gates.
 *
 * Two rules worth keeping when you edit this:
 *
 * - Every entry carries the `permission` the API enforces for that resource.
 *   `filterNavGroups` hides entries the user cannot reach, drops a collapsible
 *   once all its children are hidden, and drops a group once it is empty — so a
 *   heading only appears for someone who has something under it. That is why a
 *   receptionist sees no Certificates group without any extra wiring.
 * - Gate on the item, not the group: `NavGroup` carries no `permission` and
 *   `filterNavGroups` would not read one. The API grants every role its module
 *   gate alongside the matching model permissions, so the per-item `view` check
 *   is a faithful proxy for the gate.
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
    /* Reference data — generated from the lookup configs, so adding a    */
    /* table is one entry there rather than an entry in two places.       */
    /* ---------------------------------------------------------------- */
    {
      title: 'Reference data',
      items: [
        {
          title: 'Reference data',
          icon: Boxes,
          items: allLookupConfigs().map((config) => ({
            title: config.title,
            url: `/lookups/${config.slug}` as NavLink['url'],
            icon: Tags,
            permission: perm(config.resource, 'view'),
          })),
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
