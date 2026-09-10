import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { paymentSchema, type Payment } from './schema'

const listSchema = paginatedSchema(paymentSchema)

/**
 * Payments are read-only everywhere.
 *
 * The only legitimate writer is the GePG notification webhook, so there is no
 * create or edit path — and deliberately none here either.
 */
export async function fetchPayments(
  params: ListParams
): Promise<Paginated<Payment>> {
  const res = await api.get('/payments', { params: buildListParams(params) })

  return toPaginated(listSchema.parse(res.data), params)
}

export const paymentsQuery = (params: ListParams) =>
  queryOptions({
    queryKey: ['payments', params],
    queryFn: () => fetchPayments(params),
    placeholderData: (previous) => previous,
  })

/** The payments received against one bill, for its view dialog. */
export const billPaymentsQuery = (billId: number) =>
  queryOptions({
    queryKey: ['payments', 'by-bill', billId],
    queryFn: async () => {
      const res = await api.get('/payments', {
        params: {
          'filter[bill]': billId,
          page_size: 50,
          ordering: '-trx_dt_tm',
        },
      })
      return listSchema.parse(res.data).results
    },
  })
