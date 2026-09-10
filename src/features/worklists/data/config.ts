import { PERMISSIONS, perm } from '@/lib/permissions'

/**
 * The lab's four queues.
 *
 * Each answers "what is waiting for me right now" at one stage of the pipeline,
 * and each is served by the same screen: the four differ in exactly three ways
 * — which endpoint they read, whether the rows are orders or stones, and which
 * dialog the primary action opens. Four feature folders would be four copies of
 * one file.
 *
 * The endpoints themselves encode the queue's rules (registered, billed,
 * settled, finalized). Nothing here re-derives them.
 */

/** Which shape the rows are, and therefore which columns and dialog apply. */
export type WorklistRowKind = 'order' | 'stone'

export type WorklistConfig = {
  /** Route path segment under /worklists. */
  slug: string
  title: string
  description: string
  /** API path, relative to the client's base URL. */
  endpoint: string
  rowKind: WorklistRowKind
  /** Label on the row's primary-action button. */
  actionLabel: string
  /**
   * What the API enforces on the queue endpoint.
   *
   * Not always the obvious `view`: the billing and certification queues are
   * gated on the workflow verb, because the only reason to look at them is to
   * act on them.
   */
  permission: string
  /** Shown when the queue is empty — the good outcome, so say so plainly. */
  emptyMessage: string
}

const worklistConfigs: WorklistConfig[] = [
  {
    slug: 'registration',
    title: 'Awaiting registration',
    description:
      'Orders with stones the customer submitted but the lab has not booked in yet.',
    endpoint: '/orders/worklist-registration',
    rowKind: 'order',
    actionLabel: 'Register stone',
    permission: perm('orders', 'view'),
    emptyMessage: 'Every order is fully registered.',
  },
  {
    slug: 'billing',
    title: 'Ready to bill',
    description:
      'Orders with every stone registered and no bill raised against them.',
    endpoint: '/bills/worklist',
    rowKind: 'order',
    actionLabel: 'Generate bill',
    permission: PERMISSIONS.generateBill,
    emptyMessage: 'Nothing is waiting to be billed.',
  },
  {
    slug: 'findings',
    title: 'Awaiting findings',
    description:
      'Paid stones on the bench, whose report has not been finalized yet.',
    endpoint: '/identification-reports/worklist',
    rowKind: 'stone',
    actionLabel: 'Record findings',
    permission: perm('identification-reports', 'add'),
    emptyMessage: 'No stones are waiting for findings.',
  },
  {
    slug: 'certification',
    title: 'Ready to certify',
    description:
      'Stones with finalized findings and a settled bill, not yet certified.',
    endpoint: '/certificates/worklist',
    rowKind: 'stone',
    actionLabel: 'Issue certificate',
    permission: PERMISSIONS.issueCertificate,
    emptyMessage: 'Nothing is waiting to be certified.',
  },
]

export function worklistConfigBySlug(slug: string): WorklistConfig | undefined {
  return worklistConfigs.find((config) => config.slug === slug)
}

/** Every queue, for building navigation. */
export function allWorklistConfigs(): WorklistConfig[] {
  return worklistConfigs
}
