import {
  BadgeCheck,
  Boxes,
  ClipboardList,
  Contact,
  FlaskConical,
  Gem,
  LayoutDashboard,
  ListChecks,
  Microscope,
  Receipt,
  ScrollText,
  ShieldCheck,
  Tags,
  TerminalSquare,
  Users,
  Wallet,
} from 'lucide-react'
import { PERMISSIONS, perm } from '@/lib/permissions'
import { countQuery } from '@/features/dashboard/data/api'
import { allLookupConfigs } from '@/features/lookups/data/config'
import { worklistConfig } from '@/features/worklists/data/config'
import { type NavLink, type SidebarData } from '../types'

/**
 * Sidebar navigation.
 *
 * Five groups following the stone's journey through the lab — reception, the
 * two identification stages, billing, certification — while the work queues sit
 * up in Overview beside the dashboard (they are what staff open first) and the
 * reference tables those stages draw on sit under Administration.
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
 * Read from the worklist configs rather than hard-coded, so a queue's title,
 * route and permission stay in step with its definition.
 *
 * Every queue has an entry: the screens themselves are plain lists now, so the
 * sidebar is the only place that answers "what is waiting?".
 */
const identificationQueue = worklistConfig('identification')
const findingsQueue = worklistConfig('findings')
const billingQueue = worklistConfig('billing')
const certificationQueue = worklistConfig('certification')

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

    /* ---------------------------------------------------------------- */
    /* The bench. Each screen answers "what is waiting?" through its own  */
    /* status filter, so the queues are not repeated as separate entries. */
    /* ---------------------------------------------------------------- */
    {
      title: 'Gemmology Lab',
      permission: PERMISSIONS.moduleIdentification,
      items: [
        {
          title: identificationQueue.title,
          url: `/worklists/${identificationQueue.slug}` as NavLink['url'],
          icon: ListChecks,
          permission: identificationQueue.permission,
          count: countQuery(identificationQueue.endpoint),
        },
        {
          // Order-shaped: identifying a stone is work done against an order,
          // and what the bench needs is how many of each order are still to do.
          title: 'Identification',
          url: '/identification',
          icon: Microscope,
          permission: perm('orders', 'view'),
        },
        {
          title: 'Stones',
          url: '/stones',
          icon: Gem,
          permission: perm('stones', 'view'),
        },
        {
          title: findingsQueue.title,
          url: `/worklists/${findingsQueue.slug}` as NavLink['url'],
          icon: ListChecks,
          permission: findingsQueue.permission,
          count: countQuery(findingsQueue.endpoint),
        },
        {
          title: 'Findings',
          url: '/identification-reports',
          icon: FlaskConical,
          permission: perm('identification-reports', 'view'),
        },
      ],
    },

    /* Billing and Certificates both lead with their queue: the work comes
       before the record it produces. */
    {
      title: 'Billing',
      permission: PERMISSIONS.moduleBilling,
      items: [
        {
          title: billingQueue.title,
          url: `/worklists/${billingQueue.slug}` as NavLink['url'],
          icon: ListChecks,
          permission: billingQueue.permission,
          count: countQuery(billingQueue.endpoint),
        },
        {
          title: 'Bills',
          url: '/bills',
          icon: Receipt,
          permission: perm('bills', 'view'),
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
          title: certificationQueue.title,
          url: `/worklists/${certificationQueue.slug}` as NavLink['url'],
          icon: ListChecks,
          permission: certificationQueue.permission,
          count: countQuery(certificationQueue.endpoint),
        },
        {
          // An archive of what has been issued, which is why the queue leads:
          // this screen cannot answer "what is waiting?".
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
