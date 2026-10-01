import { z } from 'zod'
import { type StatusTone } from '@/components/status-badge'
import { customerSchema } from '@/features/customers/data/schema'

/**
 * An order as returned by the API.
 *
 * `reference_number` is allocated by the service on create and never sent back,
 * and `identified_count` is derived from the stones identified so far — it is
 * how far through identification this order is, against `stone_count`.
 *
 * The order carries no status of its own: progress is per-stone, since two
 * stones from one visit can sit at different stages.
 */
export const orderSchema = z.object({
  id: z.number(),
  reference_number: z.string(),
  customer: z.number(),
  customer_detail: customerSchema.nullable().default(null),
  received_date: z.string(),
  stone_count: z.number().default(0),
  identified_count: z.number().default(0),
  /**
   * What the next stone identified here will be called — A, B, C…
   *
   * Comes from the server rather than being derived in the browser: the label
   * is allocated by `add_stone`, and a dialog that promises "C" while the
   * service writes "D" is a disagreement nobody notices until a customer is
   * holding the paperwork. Null once every submitted stone is identified.
   */
  next_stone_label: z.string().nullable().default(null),
  /**
   * The bill raised against this order, or null if there is none yet.
   *
   * What separates "ready to bill" from "already awaiting payment" — the two
   * look identical by stone counts alone, since both are fully identified.
   */
  bill_number: z.string().nullable().default(null),
  /**
   * The number the customer quotes when paying.
   *
   * Issued by GePG in response to the bill submission, not minted here — so it
   * stays null on a bill whose submission failed, which is precisely the case
   * worth spotting from the orders list.
   */
  control_number: z.string().nullable().default(null),

  /**
   * Where the order has got to, derived server-side from its stones and bill.
   *
   * Not stored: progress is per-stone, and two stones from one visit can sit at
   * different stages, so the value reports the *least advanced* one. Derived
   * rather than written means it can never drift out of step with reality.
   */
  stage: z.string().default('identifying'),
  stage_label: z.string().default(''),

  /**
   * Whether the whole visit has been paused or withdrawn.
   *
   * The one part of an order's state that IS stored, because no stone can
   * express it — a customer asking the lab to stop is a fact about the visit.
   */
  hold_status: z.string().default('active'),
  hold_reason: z.string().default(''),
  held_by: z.number().nullable().default(null),
  held_by_label: z.string().nullable().default(null),
  held_at: z.string().nullable().default(null),

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
  deleted_at: z.string().nullable().default(null),
})

export type Order = z.infer<typeof orderSchema>

/** Whether every stone the customer submitted has been registered. */
export function isFullyIdentified(order: Order): boolean {
  return order.identified_count >= order.stone_count
}

/**
 * Whether a bill has already been raised against this order.
 *
 * An order is billed exactly once — `Bill.order` is a OneToOne — so this is
 * also what makes billing unavailable a second time.
 */
export function isBilled(order: Order): boolean {
  return Boolean(order.bill_number)
}

/** Whether work on this order has been paused or withdrawn. */
export function isHeld(order: Order): boolean {
  return order.hold_status !== 'active'
}

/**
 * Every stage, in order, for the filter.
 *
 * Rows carry their own `stage_label` from the server, so this is needed only
 * where there is no row to read one from — a dropdown of stages nobody has
 * matched yet. Mirrors `OrderStage` in `apps/gems/enums.py`.
 */
export const ORDER_STAGE_LABELS: Record<string, string> = {
  empty: 'No stones yet',
  identifying: 'Awaiting identification',
  ready_to_bill: 'Ready to bill',
  awaiting_payment: 'Awaiting payment',
  part_paid: 'Partly paid',
  in_findings: 'Findings in progress',
  certified: 'Certified',
  ready_for_collection: 'Ready for collection',
  collected: 'Collected',
  on_hold: 'On hold',
  cancelled: 'Cancelled',
}

/**
 * How each stage reads, in the shared five-tone vocabulary.
 *
 * Maps only the *meaning*, so a certified order is coloured the same as a
 * certified stone or a paid bill.
 */
export const ORDER_STAGE_TONES: Record<string, StatusTone> = {
  empty: 'neutral',
  identifying: 'info',
  ready_to_bill: 'warning',
  awaiting_payment: 'warning',
  part_paid: 'warning',
  in_findings: 'info',
  certified: 'success',
  ready_for_collection: 'success',
  collected: 'success',
  on_hold: 'warning',
  cancelled: 'danger',
}
