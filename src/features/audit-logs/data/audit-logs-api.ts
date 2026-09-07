import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  metaSchema,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { activityLogSchema, type ActivityLog } from './schema'

// A literal key (rather than the generic helper) keeps TypeScript's inference
// intact, so `parsed.activity_logs` is properly typed.
const listSchema = z.object({
  activity_logs: z.array(activityLogSchema),
  meta: metaSchema,
})

/** Fetch one page of audit entries, validated at the network boundary. */
export async function fetchActivityLogs(
  params: ListParams
): Promise<Paginated<ActivityLog>> {
  const res = await api.get('/activity-logs', {
    params: buildListParams({ ...params, include: ['causer'] }),
  })

  const parsed = listSchema.parse(res.data)
  return { items: parsed.activity_logs, meta: parsed.meta }
}

export const activityLogsQueryOptions = (params: ListParams) =>
  queryOptions({
    queryKey: ['activity-logs', params],
    queryFn: () => fetchActivityLogs(params),
    placeholderData: (previous) => previous,
  })

/**
 * Every entry for one record, newest first.
 *
 * Backs the History sheet. `subjectType` is the fully-qualified PHP class the
 * API stores (e.g. `App\Models\Product\Product`), so history cannot collide
 * between two models that happen to share an id.
 */
export const recordHistoryQueryOptions = (
  subjectType: string,
  subjectId: number,
  enabled: boolean
) =>
  queryOptions({
    queryKey: ['activity-logs', 'record', subjectType, subjectId],
    queryFn: () =>
      fetchActivityLogs({
        perPage: 50,
        sortBy: 'created_at',
        sortDir: 'desc',
        filters: { subject_type: subjectType, subject_id: subjectId },
      }),
    enabled,
  })
