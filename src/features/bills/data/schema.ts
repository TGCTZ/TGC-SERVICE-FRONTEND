import { z } from 'zod'

/**
 * Bill statuses, mirrored from `BillStatus` in `apps/gems/enums.py`.
 *
 * `cancelled` has no code path yet — bill cancellation against the gateway is
 * not implemented — but a bill can hold it, so it is rendered.
 */
export const BILL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
}

/** One charge line, snapshotted at billing time and never edited. */
const billItemSchema = z.object({
  id: z.number(),
  bill: z.number(),
  stone: z.number().nullable().default(null),
  stone_label: z.string().nullable().default(null),
  description: z.string().default(''),
  unit_price: z.string().nullable().default(null),
  weight: z.string().nullable().default(null),
  amount: z.string().nullable().default(null),
  gfs_code: z.string().nullable().default(''),
  item_ref: z.string().nullable().default(''),
})

/**
 * A bill as returned by the API.
 *
 * Every field is read-only: the billing service writes it once and thereafter
 * only the GePG callbacks change it. `control_number` is the number the
 * customer quotes when paying, and stays null until the gateway answers.
 *
 * Money crosses the wire as a string to preserve the decimal.
 */
export const billSchema = z.object({
  id: z.number(),
  order: z.number(),
  order_reference: z.string().nullable().default(null),
  customer_name: z.string().nullable().default(null),
  bill_number: z.string(),
  control_number: z.string().nullable().default(null),
  service_provider: z.number().nullable().default(null),
  service_provider_detail: z
    .object({ id: z.number(), name: z.string() })
    .loose()
    .nullable()
    .default(null),
  items: z.array(billItemSchema).default([]),
  total_amount: z.string().nullable().default(null),
  amount_paid: z.string().nullable().default('0'),
  currency: z.string().default('TZS'),
  status: z.string(),
  issued_at: z.string().nullable().default(null),
  expiry_at: z.string().nullable().default(null),
  due_date: z.string().nullable().default(null),
  bill_type: z.string().nullable().default(null),
  pay_type: z.string().nullable().default(null),
  status_code: z.string().nullable().default(null),
  status_desc: z.string().nullable().default(null),
  is_gepg_submitted: z.boolean().default(false),
  gepg_submitted_at: z.string().nullable().default(null),

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
})

export type Bill = z.infer<typeof billSchema>
