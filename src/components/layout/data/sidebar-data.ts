import {
  BadgeCheck,
  Boxes,
  ClipboardList,
  Contact,
  FlaskConical,
  Microscope,
  Receipt,
  ScrollText,
  ShieldCheck,
  Tags,
  TerminalSquare,
  Users,
  Wallet,
} from 'lucide-react'
import { countQuery } from '@/lib/count-query'
import { PERMISSIONS, perm } from '@/lib/permissions'
import { allLookupConfigs } from '@/features/lookups/data/config'
import { reportConfigs } from '@/features/reports/data/config'
import { type NavLink, type SidebarData } from '../types'

/**
 * Sidebar navigation.
 *
 * Resource pages follow the stone's journey through the lab, while badges show
 * their pending-work counts and reference tables sit under Administration.
 *
 * Identification holds both gemmological stages, because they are one person's
 * work split by payment: identification types the stone and so
 * fixes its price, then the bill is settled, then the findings
 * records the findings.
 *
 * Two rules worth keeping when you edit this:
 *
 * - Every entry carries the `permission` the API enforces for that resource.
 *   `filterNavGroups` hides entries the user cannot reach, drops a collapsible
 *   once all its children are hidden, and drops a group once it is empty — so a
 *   heading only appears for someone who has something under it. That is why a
 *   receptionist sees no Certificates group without any extra wiring.
 * - Each section also sits behind its module gate (`core.module_*`), checked on
 *   top of the items, never instead of them: the gate lets an admin hide a whole
 *   section from a role on the Roles screen, and the item permissions still
 *   decide what shows inside it. Administration holds three modules, so its
 *   gates sit on its three collapsibles, and the group goes once all three do.
 */
/*
 * Queues, each listed in the group it belongs to rather than collected in one
 * "Queues" menu — the sidebar then reads as the pipeline itself, and a queue
 * sits beside the screen whose work it feeds.
 *
 * Each resource page owns its combined feed, while the shared badge query only
 * reads that feed's waiting count.
 */
const identificationFeed = countQuery('/orders/identification-count')
const findingsFeed = countQuery('/identification-reports/workflow-feed', {
  source: 'waiting',
})
const billingFeed = countQuery('/bills/workflow-feed', { source: 'waiting' })

/** The whole navigation tree, unfiltered - `filterNavGroups` narrows it per user. */
export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'Reports',
      permission: PERMISSIONS.moduleReports,
      items: [
        {
          title: 'Financial reports',
          url: '/reports/financial',
          icon: Receipt,
          permission: reportConfigs.financial.permissions,
          gate: reportConfigs.financial.gate,
        },
        {
          title: 'Operational reports',
          url: '/reports/operational',
          icon: ClipboardList,
          permission: reportConfigs.operational.permissions,
          gate: reportConfigs.operational.gate,
        },
      ],
    },

    /* Reception's half of the pipeline: who came in, and what they left. */
    {
      title: 'Operations',
      permission: PERMISSIONS.moduleOrders,
      items: [
        {
          title: 'Customers',
          url: '/customers',
          icon: Contact,
          permission: perm('customers', 'view'),
        },
        {
          title: 'Orders',
          url: '/orders',
          icon: ClipboardList,
          permission: perm('orders', 'view'),
        },
      ],
    },

    /* The bench: waiting and completed work share each resource page. */
    {
      title: 'Gemmology Lab',
      permission: [PERMISSIONS.moduleIdentification, perm('stones', 'view')],
      items: [
        {
          title: 'Identification',
          url: '/identification',
          icon: Microscope,
          permission: [perm('orders', 'view'), perm('stones', 'view')],
          count: identificationFeed,
        },
        {
          title: 'Findings',
          url: '/identification-reports',
          icon: FlaskConical,
          permission: perm('identification-reports', 'view'),
          count: findingsFeed,
        },
      ],
    },

    /* Billing carries its pending count on the main item. */
    {
      title: 'Billing',
      permission: PERMISSIONS.moduleBilling,
      items: [
        {
          title: 'Bills',
          url: '/bills',
          icon: Receipt,
          permission: perm('bills', 'view'),
          count: billingFeed,
        },
        {
          title: 'Payments',
          url: '/payments',
          icon: Wallet,
          permission: perm('payments', 'view'),
        },
      ],
    },

    {
      title: 'Certificates',
      permission: PERMISSIONS.moduleCertificates,
      items: [
        {
          title: 'Certificates',
          url: '/certificates',
          icon: BadgeCheck,
          permission: perm('certificates', 'view'),
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    /* Administration — users, logs, and the reference tables the lab    */
    /* stages draw on.                                                   */
    /* ---------------------------------------------------------------- */
    {
      title: 'Administration',
      items: [
        {
          // A collapsible's `permission` is its module gate; filterNavGroups
          // also drops it once every child is filtered out.
          title: 'Users',
          icon: Users,
          permission: PERMISSIONS.moduleUser,
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
          permission: PERMISSIONS.moduleAudit,
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
        /* ------------------------------------------------------------ */
        /* Reference data — generated from the lookup configs, so adding */
        /* a table is one entry there rather than an entry in two        */
        /* places.                                                       */
        /* ------------------------------------------------------------ */
        {
          title: 'Reference data',
          icon: Boxes,
          permission: PERMISSIONS.moduleReference,
          items: allLookupConfigs().map((config) => ({
            title: config.title,
            url: `/lookups/${config.slug}` as NavLink['url'],
            icon: Tags,
            permission: perm(config.resource, 'view'),
          })),
        },
      ],
    },
  ],
}
