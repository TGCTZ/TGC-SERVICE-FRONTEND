import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  metaSchema,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { systemLogSchema, type SystemLog } from './schema'

const listSchema = z.object({
  system_logs: z.array(systemLogSchema),
  meta: metaSchema,
})

export async function fetchSystemLogs(
  params: ListParams
): Promise<Paginated<SystemLog>> {
  const res = await api.get('/system-logs', { params: buildListParams(params) })

  const parsed = listSchema.parse(res.data)
  return { items: parsed.system_logs, meta: parsed.meta }
}

export const systemLogsQueryOptions = (params: ListParams) =>
  queryOptions({
    queryKey: ['system-logs', params],
    queryFn: () => fetchSystemLogs(params),
    placeholderData: (previous) => previous,
  })

const levelsSchema = z.object({ levels: z.array(z.string()) })

/**
 * Levels actually present in the files.
 *
 * Read from the data rather than hardcoding Monolog's eight severities, so the
 * filter never offers a level that would return nothing.
 */
export const systemLogLevelsQuery = () =>
  queryOptions({
    queryKey: ['system-logs', 'levels'],
    queryFn: async () => {
      const res = await api.get('/system-logs/levels')
      return levelsSchema.parse(res.data).levels
    },
    staleTime: 5 * 60 * 1000,
  })
