import { PERMISSIONS, perm } from '@/lib/permissions'

/**
 * Legacy metadata for standalone worklist pages.
 *
 * Current resource pages fetch their own pending work, and navigation badges
 * use feature-specific count queries. No route consumes this registry; it
 * remains as metadata exercised by its tests.
 */

/** Which shape the rows are, and therefore which columns and dialog apply. */
export type WorklistRowKind = 'order' | 'stone'

export type WorklistConfig = {
  /** Legacy standalone-route key. */
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
   * Not always the obvious `view`: the billing queue is gated on its workflow
   * verb, because the only reason to look at it is to act on it.
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
    description: 'Orders with stones that still need a type.',
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
    description: 'Identified orders without a bill.',
    endpoint: '/bills/worklist',
    rowKind: 'order',
    actionLabel: 'Request control number',
    permission: PERMISSIONS.generateBill,
    emptyMessage: 'Nothing is waiting to be billed.',
    searchPlaceholder: 'Search reference, customer or phone...',
  },
  {
    slug: 'findings',
    title: 'Findings queue',
    description: 'Paid stones awaiting findings.',
    endpoint: '/identification-reports/worklist',
    rowKind: 'stone',
    actionLabel: 'Record findings',
    permission: perm('identification-reports', 'add'),
    emptyMessage: 'No stones are waiting for findings.',
    searchPlaceholder: 'Search label, reference, type or customer...',
  },
]

export function worklistConfigBySlug(slug: string): WorklistConfig | undefined {
  return worklistConfigs.find((config) => config.slug === slug)
}

/** Return every entry in the legacy metadata registry. */
export function allWorklistConfigs(): WorklistConfig[] {
  return worklistConfigs
}

/**
 * Resolve one entry in the legacy metadata registry by its key.
 */
export function worklistConfig(slug: string): WorklistConfig {
  const config = worklistConfigBySlug(slug)
  if (!config) throw new Error(`No worklist config for slug "${slug}".`)
  return config
}
