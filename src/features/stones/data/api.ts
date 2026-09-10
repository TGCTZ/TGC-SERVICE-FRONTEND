import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import {
  statusHistorySchema,
  stoneSchema,
  type StatusHistoryEntry,
  type Stone,
} from './schema'

const listSchema = paginatedSchema(stoneSchema)

export async function fetchStones(
  params: ListParams
): Promise<Paginated<Stone>> {
  const res = await api.get('/stones', { params: buildListParams(params) })

  return toPaginated(listSchema.parse(res.data), params)
}

export const stonesQuery = (params: ListParams) =>
  queryOptions({
    queryKey: ['stones', params],
    queryFn: () => fetchStones(params),
    placeholderData: (previous) => previous,
  })

/**
 * The stones registered against one order.
 *
 * Filtered server-side rather than fetched whole and filtered here — an order
 * holds a handful of stones and the database is the right place to say which.
 */
export const orderStonesQuery = (orderId: number) =>
  queryOptions({
    queryKey: ['stones', 'by-order', orderId],
    queryFn: async () => {
      const res = await api.get('/stones', {
        params: { 'filter[order]': orderId, page_size: 100, ordering: 'label' },
      })
      return listSchema.parse(res.data).results
    },
  })

export type StonePayload = Record<string, unknown>

/**
 * Update a stone's editable facts.
 *
 * There is no create here on purpose: a stone is registered through
 * `POST /orders/{id}/stones/`, which owns the A/B/C label sequence and the cap
 * at `order.stone_count`. A bare create would bypass both.
 */
export async function updateStone(
  id: number,
  payload: StonePayload
): Promise<Stone> {
  const res = await api.put(`/stones/${id}`, payload)
  return stoneSchema.parse(res.data)
}

export async function deleteStone(id: number): Promise<void> {
  await api.delete(`/stones/${id}`)
}

/** Deletes are soft, so a removed stone can always be brought back. */
export async function restoreStone(id: number): Promise<void> {
  await api.post(`/stones/${id}/restore`)
}

/**
 * Move a stone to a new status.
 *
 * A dedicated action rather than a writable field: the service records who
 * moved it and why, so the status trail is complete by construction.
 *
 * @param id - The stone being moved.
 * @param toStatus - The status code to move it to.
 * @param note - Optional reason, shown in the stone's status history.
 */
export async function transitionStone(
  id: number,
  toStatus: string,
  note: string
): Promise<Stone> {
  const res = await api.post(`/stones/${id}/transition`, {
    to_status: toStatus,
    note,
  })
  return stoneSchema.parse(res.data)
}

/** A stone's domain status trail, distinct from the audit log. */
export const stoneStatusHistoryQuery = (stoneId: number) =>
  queryOptions({
    queryKey: ['status-history', stoneId],
    queryFn: async (): Promise<StatusHistoryEntry[]> => {
      const res = await api.get('/status-history', {
        params: {
          'filter[stone]': stoneId,
          page_size: 100,
          ordering: 'changed_at',
        },
      })
      return paginatedSchema(statusHistorySchema).parse(res.data).results
    },
  })
