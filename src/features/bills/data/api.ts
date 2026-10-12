import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { billSchema, type Bill } from './schema'

/** Fetch a single bill so asynchronous GePG responses can be observed. */
export const billQuery = (id: number) =>
  queryOptions({
    queryKey: ['bills', 'detail', id],
    queryFn: async (): Promise<Bill> => {
      const res = await api.get(`/bills/${id}`)
      return billSchema.parse(res.data)
    },
  })

/** One line the bill would carry, priced but not yet written. */
const billPreviewSchema = z.object({
  items: z
    .array(
      z.object({
        stone: z.number(),
        label: z.string(),
        description: z.string(),
        category: z.string(),
        /** Null when the stone's category carries no fee. */
        amount: z.string().nullable().default(null),
      })
    )
    .default([]),
  total: z.string().nullable().default('0'),
  currency: z.string().default('TZS'),
  /** Reasons the order cannot be billed. Empty means it can. */
  blockers: z.array(z.string()).default([]),
})

type BillPreview = z.infer<typeof billPreviewSchema>

/**
 * What billing an order would charge, without creating anything.
 *
 * Priced by the server rather than here: the fee is per stone *category*, not
 * per type, so a total computed in the browser from `stone_type.price` would
 * disagree with the bill it claims to preview.
 */
export const billPreviewQuery = (orderId: number) =>
  queryOptions({
    queryKey: ['bills', 'preview', orderId],
    queryFn: async (): Promise<BillPreview> => {
      const res = await api.get('/bills/preview', {
        params: { order: orderId },
      })
      return billPreviewSchema.parse(res.data)
    },
  })

/**
 * Settle a bill with a fabricated GePG notification. Development only.
 *
 * The server answers 404 unless it has both DEBUG and GEPG_SIMULATE on, so this
 * cannot reach a deployment that must never have it. Omit `amount` to pay the
 * balance outstanding; pass less to produce a part-paid bill, which nothing
 * else in the system can do offline.
 */
export async function simulateBillPayment(
  id: number,
  amount?: string
): Promise<Bill> {
  const res = await api.post(
    `/bills/${id}/simulate-payment`,
    amount ? { amount } : {}
  )
  return billSchema.parse(res.data)
}
