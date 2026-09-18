import { z } from 'zod'

/** The expanded stone type shipped alongside its id. */
const stoneTypeSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    price: z.string().nullable().default(null),
  })
  .loose()

/**
 * The slice of an identification report a stone's row carries.
 *
 * Enough to tell the three states of a stone apart — no report, a draft, a
 * finalized one — without a second request. The findings queue turns on exactly
 * this: `Stone.report` is a one-to-one on the server, so offering "Record
 * findings" on a stone that already has a draft would post a create and be
 * rejected as a duplicate.
 */
const stoneReportSchema = z.object({
  id: z.number(),
  report_number: z.string(),
  is_finalized: z.boolean(),
})

/**
 * A stone as returned by the API.
 *
 * `label`, `status` and `order` are read-only: the label is allocated by the
 * identification service, the status only ever moves through
 * `POST {id}/transition/` so that every change writes a history row, and a
 * stone cannot be moved between orders.
 *
 * `weight` is a decimal, which crosses the wire as a string to survive the
 * round trip without losing precision.
 */
export const stoneSchema = z.object({
  id: z.number(),
  order: z.number(),
  order_reference: z.string().nullable().default(null),
  /** The customer whose visit this stone came in on. */
  customer_name: z.string().nullable().default(null),
  customer_phone: z.string().nullable().default(null),
  label: z.string(),
  stone_type: z.number().nullable().default(null),
  stone_type_detail: stoneTypeSchema.nullable().default(null),
  weight: z.string().nullable().default(null),
  weight_unit: z.string().default('carat'),
  /** Absolute URL of the bench photograph, or null. Printed on the certificate. */
  photo: z.string().nullable().default(null),
  status: z.string(),
  /** The stone's report, or null when no findings have been recorded yet. */
  report_detail: stoneReportSchema.nullable().default(null),

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
  deleted_at: z.string().nullable().default(null),
})

export type Stone = z.infer<typeof stoneSchema>

/**
 * One entry in a stone's status trail.
 *
 * A domain ledger, distinct from the audit log behind `<RecordHistorySheet>`:
 * it records why a stone moved, including moves the payment gateway made with
 * no user attached — which is what `changed_by_label` renders as "System".
 */
export const statusHistorySchema = z.object({
  id: z.number(),
  stone: z.number(),
  from_status: z.string().default(''),
  to_status: z.string(),
  changed_by: z.number().nullable().default(null),
  changed_by_label: z.string().default('System'),
  changed_at: z.string(),
  note: z.string().default(''),
})

export type StatusHistoryEntry = z.infer<typeof statusHistorySchema>
