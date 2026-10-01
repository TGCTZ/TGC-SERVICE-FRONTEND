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
 * The endpoints themselves encode the queue's rules (identified, billed,
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
  /**
   * Placeholder for the queue's search box.
   *
   * Names the fields the endpoint actually searches, which differ by row kind:
   * an order is found by its reference or its customer, a stone also by its
   * label and type. A queue with no placeholder gets no search box.
   */
  searchPlaceholder?: string
}

const worklistConfigs: WorklistConfig[] = [
  {
    slug: 'identification',
    title: 'Identification queue',
    description:
      "Orders with stones still to be typed. A stone's type is what prices it, so nothing here can be billed yet.",
    endpoint: '/orders/worklist',
    rowKind: 'order',
    actionLabel: 'Identify stone',
    // The workflow verb, not `view`: the endpoint enforces orders.add_stone,
    // because the only reason to open this queue is to work it.
    permission: perm('stones', 'add'),
    emptyMessage: 'Every order is fully identified.',
    searchPlaceholder: 'Search reference, customer or phone...',
  },
  {
    slug: 'billing',
    title: 'Ready to bill',
    description:
      'Orders with every stone identified and no bill raised against them.',
    endpoint: '/bills/worklist',
    rowKind: 'order',
    actionLabel: 'Generate bill',
    permission: PERMISSIONS.generateBill,
    emptyMessage: 'Nothing is waiting to be billed.',
    searchPlaceholder: 'Search reference, customer or phone...',
  },
  {
    slug: 'findings',
    title: 'Findings queue',
    description:
      'Paid stones on the bench, whose findings has not been finalized yet.',
    endpoint: '/identification-reports/worklist',
    rowKind: 'stone',
    actionLabel: 'Record findings',
    permission: perm('identification-reports', 'add'),
    emptyMessage: 'No stones are waiting for findings.',
    searchPlaceholder: 'Search label, reference, type or customer...',
  },
  {
    slug: 'certification',
    title: 'Certification queue',
    description:
      'Stones with a finalized findings and a settled bill, not yet certified.',
    endpoint: '/certificates/worklist',
    rowKind: 'stone',
    actionLabel: 'Issue certificate',
    permission: PERMISSIONS.issueCertificate,
    emptyMessage: 'Nothing is waiting to be certified.',
    searchPlaceholder: 'Search label, reference, type or customer...',
  },
]

export function worklistConfigBySlug(slug: string): WorklistConfig | undefined {
  return worklistConfigs.find((config) => config.slug === slug)
}

/** Every queue, for building navigation. */
export function allWorklistConfigs(): WorklistConfig[] {
  return worklistConfigs
}

/**
 * One queue by slug, for placing it beside the resource it feeds.
 *
 * A queue is reachable from two places on purpose. Under *Queues* it sits with
 * the others, which is how you work through a shift; under its own resource it
 * answers "what is waiting?" while you are already looking at that screen — and
 * that second question is the one people arrive with. Both routes hit the same
 * page, so there is nothing to keep in step.
 */
export function worklistConfig(slug: string): WorklistConfig {
  const config = worklistConfigBySlug(slug)
  if (!config) throw new Error(`No worklist config for slug "${slug}".`)
  return config
}
