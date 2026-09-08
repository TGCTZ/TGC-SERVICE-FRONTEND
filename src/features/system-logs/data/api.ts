import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  DEFAULT_PAGE_SIZE,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { systemLogWireSchema, type SystemLog } from './schema'

const listSchema = z.array(systemLogWireSchema)

/**
 * Fetch log lines, paginated client-side.
 *
 * This endpoint is the one exception to the project's list contract: it reads
 * the tail of a log file, so it returns a bare array with no envelope, no
 * `filter[...]` parameters and no page parameter. It takes `level` and `search`
 * directly, and returns every matching line at once.
 *
 * The response is bounded by the tail the server reads, so slicing a page out
 * of it here costs nothing and lets the screen reuse the same table, pager and
 * `Paginated` shape as every other list.
 */
export async function fetchSystemLogs(
  params: ListParams
): Promise<Paginated<SystemLog>> {
  const level = params.filters?.level
  const search = params.search?.trim()

  const res = await api.get('/system-logs', {
    params: {
      ...(level ? { level } : {}),
      ...(search ? { search } : {}),
    },
  })

  const entries = listSchema.parse(res.data).map((entry, index) => ({
    id: index,
    logged_at: entry.timestamp,
    level: entry.level,
    message: entry.message,
    file: entry.logger,
  }))

  const perPage = params.perPage ?? DEFAULT_PAGE_SIZE
  const page = params.page ?? 1
  const start = (page - 1) * perPage

  return {
    items: entries.slice(start, start + perPage),
    meta: {
      current_page: page,
      last_page: Math.max(1, Math.ceil(entries.length / perPage)),
      per_page: perPage,
      total: entries.length,
    },
  }
}

export const systemLogsQueryOptions = (params: ListParams) =>
  queryOptions({
    queryKey: ['system-logs', params],
    queryFn: () => fetchSystemLogs(params),
    placeholderData: (previous) => previous,
  })

const levelsSchema = z.object({ levels: z.array(z.string()) })

/** Log levels offered by the filter. */
export const systemLogLevelsQuery = () =>
  queryOptions({
    queryKey: ['system-logs', 'levels'],
    queryFn: async () => {
      const res = await api.get('/system-logs/levels')
      return levelsSchema.parse(res.data).levels
    },
    staleTime: 5 * 60 * 1000,
  })
