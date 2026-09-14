import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { billSchema, type Bill } from './schema'

const listSchema = paginatedSchema(billSchema)

/**
 * Bills are read-only here.
 *
 * One is created by `POST /bills/generate/` — see `features/orders` — and
 * thereafter written only by the GePG payment callbacks, so this module has no
 * create, update, delete or restore.
 */
export async function fetchBills(params: ListParams): Promise<Paginated<Bill>> {
  const res = await api.get('/bills', { params: buildListParams(params) })

  return toPaginated(listSchema.parse(res.data), params)
}

export const billsQuery = (params: ListParams) =>
  queryOptions({
    queryKey: ['bills', params],
    queryFn: () => fetchBills(params),
    placeholderData: (previous) => previous,
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

export type BillPreview = z.infer<typeof billPreviewSchema>

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
