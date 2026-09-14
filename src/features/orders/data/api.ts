import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { stoneSchema, type Stone } from '@/features/stones/data/schema'
import { orderSchema, type Order } from './schema'

const listSchema = paginatedSchema(orderSchema)

export async function fetchOrders(
  params: ListParams
): Promise<Paginated<Order>> {
  const res = await api.get('/orders', { params: buildListParams(params) })

  return toPaginated(listSchema.parse(res.data), params)
}

export const ordersQuery = (params: ListParams) =>
  queryOptions({
    queryKey: ['orders', params],
    queryFn: () => fetchOrders(params),
    placeholderData: (previous) => previous,
  })

/**
 * Orders with stones still to identify.
 *
 * The same endpoint the identification queue reads, reused to populate the
 * order picker: it returns exactly the orders that still have a free slot, so
 * a full order cannot be chosen and the list empties itself when there is no
 * work left.
 */
export const identifiableOrdersQuery = () =>
  queryOptions({
    queryKey: ['worklist', 'identification', 'options'],
    queryFn: async () => {
      const res = await api.get('/orders/worklist', {
        params: { page_size: 100, ordering: 'received_date' },
      })
      return paginatedSchema(orderSchema).parse(res.data).results
    },
  })

export type OrderPayload = Record<string, unknown>

export async function createOrder(payload: OrderPayload): Promise<Order> {
  const res = await api.post('/orders', payload)
  return orderSchema.parse(res.data)
}

export async function updateOrder(
  id: number,
  payload: OrderPayload
): Promise<Order> {
  const res = await api.put(`/orders/${id}`, payload)
  return orderSchema.parse(res.data)
}

export async function deleteOrder(id: number): Promise<void> {
  await api.delete(`/orders/${id}`)
}

/** Deletes are soft, so a removed order can always be brought back. */
export async function restoreOrder(id: number): Promise<void> {
  await api.post(`/orders/${id}/restore`)
}

/**
 * Record the identification of the next stone.
 *
 * A sub-resource rather than `POST /stones/`: the service owns the A/B/C label
 * sequence and the cap at `order.stone_count`, and refuses with a 400 once the
 * order is full.
 *
 * @param orderId - The order the stone belongs to.
 * @param payload - `stone_type`, and optionally `weight` and `weight_unit`.
 * @returns The stone the service created, label included.
 */
export async function addStone(
  orderId: number,
  payload: Record<string, unknown>
): Promise<Stone> {
  const res = await api.post(`/orders/${orderId}/stones`, payload)
  return stoneSchema.parse(res.data)
}

/**
 * Bill an order: price every stone and submit the bill to GePG.
 *
 * Lives on `/bills/` rather than under the order because `apps.orders` sits a
 * layer below `apps.billing` on the server and must not know about it.
 *
 * @param orderId - The order to bill.
 * @param serviceProvider - Optional collecting provider; the API picks the
 *   default when omitted.
 */
export async function generateBill(
  orderId: number,
  serviceProvider?: number
): Promise<{ id: number; bill_number: string; control_number: string | null }> {
  const res = await api.post('/bills/generate', {
    order: orderId,
    ...(serviceProvider ? { service_provider: serviceProvider } : {}),
  })
  return res.data
}

/**
 * Pause or withdraw a whole order.
 *
 * The one part of an order's state that is written rather than derived: a
 * customer asking the lab to stop is a fact about the visit, not about any
 * stone in it. Undoes nothing — stones keep their statuses and the bill stands.
 */
export async function holdOrder(
  id: number,
  payload: { hold_status: 'on_hold' | 'cancelled'; reason: string }
): Promise<Order> {
  const res = await api.post(`/orders/${id}/hold`, payload)
  return orderSchema.parse(res.data)
}

/** Return a held or cancelled order to active work. */
export async function releaseOrder(id: number): Promise<Order> {
  const res = await api.post(`/orders/${id}/release`)
  return orderSchema.parse(res.data)
}
