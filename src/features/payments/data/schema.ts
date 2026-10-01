import { z } from 'zod'

/**
 * A payment exactly as GePG sent it.
 *
 * The gateway's notification is stored field for field rather than reduced to
 * "who paid how much", because a payment dispute is settled by what the
 * gateway said, not by our summary of it. That is why there are twenty-odd
 * fields here and only four columns in the table — the rest belong in the view
 * dialog.
 *
 * `trx_id` is the gateway's transaction id and the key idempotency is built on:
 * a redelivered notification carries the same one and is not counted twice.
 */
export const paymentSchema = z.object({
  id: z.number(),
  bill: z.number().nullable().default(null),

  req_id: z.string().nullable().default(''),
  grp_bill_id: z.string().nullable().default(''),
  sp_grp_code: z.string().nullable().default(''),
  cust_cntr_num: z.string().nullable().default(''),
  entry_count: z.number().nullable().default(null),
  sp_code: z.string().nullable().default(''),
  gepg_bill_id: z.string().nullable().default(''),
  bill_ctr_num: z.string().nullable().default(''),
  psp_code: z.string().nullable().default(''),
  psp_name: z.string().nullable().default(''),
  trx_id: z.string().nullable().default(''),
  pay_ref_id: z.string().nullable().default(''),
  bill_amount: z.string().nullable().default(null),
  paid_amount: z.string().nullable().default(null),
  bill_pay_opt: z.string().nullable().default(''),
  currency: z.string().nullable().default('TZS'),
  coll_acc_num: z.string().nullable().default(''),
  trx_dt_tm: z.string().nullable().default(null),
  usd_pay_chnl: z.string().nullable().default(''),
  pyr_cell_num: z.string().nullable().default(''),
  pyr_email: z.string().nullable().default(''),
  pyr_name: z.string().nullable().default(''),
  ack_id: z.string().nullable().default(''),
  ack_sts_code: z.string().nullable().default(''),
  /** Whether the notification has been applied to its bill. */
  is_processed: z.boolean().default(false),
  raw_request: z.string().nullable().default(''),

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
})

export type Payment = z.infer<typeof paymentSchema>
