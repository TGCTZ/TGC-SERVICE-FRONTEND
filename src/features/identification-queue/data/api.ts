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

type IdentificationParams = ListParams & {
  /**
   * An `OrderStage` value.
   *
   * The same param the Orders screen filters on, because these are the same
   * rows with the same Status column - an order's stage is derived from its
   * stones and its bill, and `orders_at_stage` re-expresses that as SQL.
   */
  stage?: string
}

/**
 * Orders, narrowed by the stage they have reached.
 *
 * `stage` rides alongside the shared list contract rather than inside
 * `filters`: it is not a column. It is derived from the stones and the bill,
 * and the API re-expresses that derivation as SQL, so no `filter[field]`
 * lookup can reach it.
 */
export const identificationOrdersQuery = ({
  stage,
  ...params
}: IdentificationParams) =>
  queryOptions({
    queryKey: ['orders', 'identification', stage, params],
    placeholderData: (previous) => previous,
    queryFn: async (): Promise<Paginated<Order>> => {
      const res = await api.get('/orders', {
        params: {
          ...buildListParams(params),
          ...(stage ? { stage } : {}),
        },
      })

      return toPaginated(listSchema.parse(res.data), params)
    },
  })
