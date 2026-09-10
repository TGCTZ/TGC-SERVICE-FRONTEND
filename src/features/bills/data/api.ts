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
