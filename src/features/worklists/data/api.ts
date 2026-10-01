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
import { stoneSchema, type Stone } from '@/features/stones/data/schema'
import { type WorklistConfig } from './config'

const orderListSchema = paginatedSchema(orderSchema)
const stoneListSchema = paginatedSchema(stoneSchema)

/** A page of whichever shape the queue returns. */
type WorklistPage =
  | { kind: 'order'; page: Paginated<Order> }
  | { kind: 'stone'; page: Paginated<Stone> }

/**
 * Read one queue.
 *
 * The endpoint and the row shape both come from the config, so adding a queue
 * needs no code here. Queues are read-only and take no filters beyond paging —
 * the endpoint's whole job is to decide what belongs in it.
 */
export const worklistQuery = (config: WorklistConfig, params: ListParams) =>
  queryOptions({
    // The endpoint and row shape are in the key as well as the slug: they are
    // what the response actually depends on, so a config edit invalidates the
    // cache rather than serving rows of the wrong shape from the old entry.
    queryKey: [
      'worklist',
      config.slug,
      config.endpoint,
      config.rowKind,
      params,
    ],
    placeholderData: (previous) => previous,
    queryFn: async (): Promise<WorklistPage> => {
      const res = await api.get(config.endpoint, {
        params: buildListParams(params),
      })

      return config.rowKind === 'order'
        ? {
            kind: 'order',
            page: toPaginated(orderListSchema.parse(res.data), params),
          }
        : {
            kind: 'stone',
            page: toPaginated(stoneListSchema.parse(res.data), params),
          }
    },
  })
