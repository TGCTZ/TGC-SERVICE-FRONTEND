import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { orderSchema, type Order } from '@/features/orders/data/schema'

const listSchema = paginatedSchema(orderSchema)

/** Which orders to list, by how far through identification they are. */
export type IdentificationFilter = 'pending' | 'complete'

type IdentificationParams = ListParams & {
  identification?: IdentificationFilter
}

/**
 * Orders, narrowed by how much of their identification is done.
 *
 * `identification` rides alongside the shared list contract rather than inside
 * `filters`: the API takes it as a bare query param, because "some stones still
 * to type" compares two columns (`Count(stones)` against `stone_count`) and no
 * `filter[field]` lookup can express that.
 */
export const identificationOrdersQuery = ({
  identification,
  ...params
}: IdentificationParams) =>
  queryOptions({
    queryKey: ['orders', 'identification', identification, params],
    placeholderData: (previous) => previous,
    queryFn: async (): Promise<Paginated<Order>> => {
      const res = await api.get('/orders', {
        params: {
          ...buildListParams(params),
          ...(identification ? { identification } : {}),
        },
      })

      return toPaginated(listSchema.parse(res.data), params)
    },
  })
