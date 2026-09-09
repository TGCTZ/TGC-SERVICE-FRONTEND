import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { type PermissionResource } from '@/lib/permissions'
import {
  lookupOptionSchema,
  lookupRowSchema,
  type LookupOption,
  type LookupRow,
} from './config'

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
): Promise<LookupRow> {
  const res = await api.post(`/${resource}`, payload)
  return lookupRowSchema.parse(res.data)
}

export async function updateLookupRow(
  resource: string,
  id: number,
  payload: LookupPayload
): Promise<LookupRow> {
  const res = await api.put(`/${resource}/${id}`, payload)
  return lookupRowSchema.parse(res.data)
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
  await api.post(`/${resource}/${id}/restore`)
}

/**
 * Every option of a reference table, for populating a `<Select>`.
 *
 * Reference tables are small and rarely change, so the whole list is fetched
 * once at a large page size and cached for the session rather than paged. Only
 * active rows are offered: a retired stone type must not be selectable on a new
 * record, though existing records keep pointing at it.
 *
 * This is the one helper every form in the app uses to fill a dropdown.
 */
async function fetchLookupOptions(
  resource: PermissionResource
): Promise<LookupOption[]> {
  const res = await api.get(`/${resource}`, {
    params: { page_size: 100, 'filter[is_active]': 1, ordering: 'name' },
  })

  return paginatedSchema(lookupOptionSchema).parse(res.data).results
}

export const lookupOptionsQuery = (resource: PermissionResource) =>
  queryOptions({
    queryKey: ['lookup', resource],
    queryFn: () => fetchLookupOptions(resource),
    staleTime: 10 * 60 * 1000,
  })
