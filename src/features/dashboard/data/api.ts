import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * How many rows an endpoint would return, without fetching them.
 *
 * Every list response carries a `count` alongside its page of results, so a
 * counter costs one row rather than a full page. That is the whole reason the
 * dashboard can show a dozen numbers without a dedicated stats endpoint.
 *
 * @param path - Any list endpoint, including the worklists.
 * @param params - Filters, in the API's bracketed form.
 */
export const countQuery = (
  path: string,
  params: Record<string, unknown> = {}
) =>
  queryOptions({
    queryKey: ['count', path, params],
    // The numbers are a status board, not a live feed; a minute is close
    // enough and keeps a dashboard visit from being a dozen requests.
    staleTime: 60 * 1000,
    queryFn: async (): Promise<number> => {
      const res = await api.get(path, { params: { ...params, page_size: 1 } })
      return Number(res.data?.count ?? 0)
    },
  })
