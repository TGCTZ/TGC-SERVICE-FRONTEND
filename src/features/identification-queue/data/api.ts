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
 * Fully identified orders, narrowed by the stage they have reached.
 *
 * `identification=complete` is sent on every request, stage or no stage.
 * Orders with stones still to type belong in the identification queue, and a
 * hold or cancellation outranks identification in the stage derivation - so
 * `stage=on_hold` alone would bring half-typed orders back. The API ANDs the
 * two filters rather than letting the stage win.
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
          identification: 'complete',
          ...(stage ? { stage } : {}),
        },
      })

      return toPaginated(listSchema.parse(res.data), params)
    },
  })
