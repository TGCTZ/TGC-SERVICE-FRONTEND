import { z } from 'zod'
import { customerSchema } from '@/features/customers/data/schema'

/**
 * An order as returned by the API.
 *
 * `reference_number` is allocated by the service on create and never sent back,
 * and `identified_count` is derived from the stones registered so far — it is
 * how far through registration this order is, against `stone_count`.
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

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
  deleted_at: z.string().nullable().default(null),
})

export type Order = z.infer<typeof orderSchema>

/** Whether every stone the customer submitted has been registered. */
export function isFullyRegistered(order: Order): boolean {
  return order.identified_count >= order.stone_count
}
