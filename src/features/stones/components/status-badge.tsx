import { createStatusBadge, type StatusTone } from '@/components/status-badge'
import { STONE_STATUS_LABELS } from '../data/enums'

/**
 * What each status means, in the shared five-tone vocabulary.
 *
 * Mirrors `StoneStatus` in `apps/gems/enums.py`. Anything unlisted is neutral,
 * which is the right default for an ordinary step along the pipeline —
 * `received` is not news.
 */
const TONES: Record<string, StatusTone> = {
  under_identification: 'info',
  billed: 'warning',
  paid: 'success',
  certified: 'success',
  ready_for_collection: 'success',
  collected: 'success',
  on_hold: 'warning',
  cancelled: 'danger',
}

/** A stone's status, rendered from the code the API stores. */
export const StoneStatusBadge = createStatusBadge(STONE_STATUS_LABELS, TONES)
