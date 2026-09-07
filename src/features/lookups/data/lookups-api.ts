import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  metaSchema,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { lookupRowSchema, type LookupRow } from './lookup-config'

/**
 * Every lookup endpoint shares one contract, so a single client covers all of
 * them; only the URL segment and the collection key differ.
 */
function listSchema(collectionKey: string) {
  return z.object({
    [collectionKey]: z.array(lookupRowSchema),
    meta: metaSchema,
  })
}

export async function fetchLookupRows(
  resource: string,
  collectionKey: string,
  params: ListParams
): Promise<Paginated<LookupRow>> {
  const res = await api.get(`/${resource}`, { params: buildListParams(params) })

  const parsed = listSchema(collectionKey).parse(res.data) as Record<
    string,
    unknown
  >

  return {
    items: parsed[collectionKey] as LookupRow[],
    meta: parsed.meta as Paginated<LookupRow>['meta'],
  }
}

export const lookupRowsQuery = (
  resource: string,
  collectionKey: string,
  params: ListParams
) =>
  queryOptions({
    queryKey: ['lookups', resource, collectionKey, params],
    queryFn: () => fetchLookupRows(resource, collectionKey, params),
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
