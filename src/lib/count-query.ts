import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * Fetch a list endpoint's count for shared sidebar queue badges.
 *
 * Request one row because the standard list envelope already includes the full
 * result count. A minute of caching keeps navigation from refreshing every badge
 * on each page change.
 *
 * @param path - Any list endpoint, including worklists.
 * @param params - Filters in the API's bracketed form.
 * @returns Query options resolving to the total matching row count.
 */
export const countQuery = (
  path: string,
  params: Record<string, unknown> = {}
) =>
  queryOptions({
    queryKey: ['count', path, params],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<number> => {
      const res = await api.get(path, { params: { ...params, page_size: 1 } })
      return Number(res.data?.count ?? 0)
    },
  })
