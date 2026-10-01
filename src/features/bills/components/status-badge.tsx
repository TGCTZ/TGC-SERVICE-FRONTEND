import { createStatusBadge, type StatusTone } from '@/components/status-badge'
import { BILL_STATUS_LABELS } from '../data/schema'

/**
 * Money owed reads as a warning; money settled as success.
 *
 * `partially_paid` is deliberately a warning rather than a success: a bill that
 * is 90% paid is still a bill nobody can act on, and the stones stay billed
 * until the balance lands.
 */
const TONES: Record<string, StatusTone> = {
  pending: 'warning',
  partially_paid: 'warning',
  paid: 'success',
  cancelled: 'danger',
  expired: 'danger',
}

/** A bill's payment state. */
export const BillStatusBadge = createStatusBadge(BILL_STATUS_LABELS, TONES)
