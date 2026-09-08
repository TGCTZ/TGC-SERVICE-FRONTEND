import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { lookupRowSchema, type LookupRow } from './config'

/**
 * Every lookup endpoint shares one contract, so a single client covers all of
 * them; only the URL segment differs.
 */
const listSchema = paginatedSchema(lookupRowSchema)

export async function fetchLookupRows(
  resource: string,
  params: ListParams
): Promise<Paginated<LookupRow>> {
  const res = await api.get(`/${resource}`, { params: buildListParams(params) })

  return toPaginated(listSchema.parse(res.data), params)
}

export const lookupRowsQuery = (resource: string, params: ListParams) =>
  queryOptions({
    queryKey: ['lookups', resource, params],
    queryFn: () => fetchLookupRows(resource, params),
    placeholderData: (previous) => previous,
  })

export type LookupPayload = Record<string, unknown>

export async function createLookupRow(
  resource: string,
  payload: LookupPayload
): Promise<void> {
  await api.post(`/${resource}`, payload)
}

export async function updateLookupRow(
  resource: string,
  id: number,
  payload: LookupPayload
): Promise<void> {
  await api.put(`/${resource}/${id}`, payload)
}

export async function deleteLookupRow(
  resource: string,
  id: number
): Promise<void> {
  await api.delete(`/${resource}/${id}`)
}

/** Deletes are soft, so a deleted lookup can always be brought back. */
export async function restoreLookupRow(
  resource: string,
  id: number
): Promise<void> {
  await api.patch(`/${resource}/${id}/restore`)
}
