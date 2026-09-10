/**
 * Stone enums, mirrored from `apps/gems/enums.py`.
 *
 * The API exposes no choices endpoint, so the values are kept here and must be
 * changed in step with the backend. A value the server does not accept comes
 * back as a 400 naming the field, so a drift is loud rather than silent.
 */

/** Every status a stone can hold, for rendering one that already exists. */
export const STONE_STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  under_identification: 'Under identification',
  billed: 'Billed',
  paid: 'Paid',
  certified: 'Certified',
  ready_for_collection: 'Ready for collection',
  collected: 'Collected',
  on_hold: 'On hold',
  cancelled: 'Cancelled',
}

/**
 * The statuses a user may move a stone to by hand.
 *
 * Deliberately narrower than `StoneStatus`. Four of the nine are written by the
 * pipeline itself — billing sets `billed`, a settled payment sets `paid`,
 * issuing a certificate sets `certified` — and the three handover stages
 * (`ready_for_collection`, `collected`, `under_identification`) have no code
 * path behind them yet. Offering those would let someone park a stone in a
 * state no other screen understands.
 *
 * What is left is the pair a human genuinely decides: hold it, or cancel it —
 * plus `received`, to undo either.
 */
export const TRANSITIONABLE_STATUSES = [
  'received',
  'on_hold',
  'cancelled',
] as const

/** How a stone's weight is measured. */
export const WEIGHT_UNITS = [
  { value: 'carat', label: 'Carat (ct)' },
  { value: 'gram', label: 'Gram (g)' },
] as const

/** Short symbol for a weight unit, for table cells. */
export const WEIGHT_UNIT_SYMBOLS: Record<string, string> = {
  carat: 'ct',
  gram: 'g',
}
