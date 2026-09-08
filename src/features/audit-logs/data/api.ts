import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { activityLogSchema, eventToAction, type ActivityLog } from './schema'

const listSchema = paginatedSchema(activityLogSchema)

/**
 * Translate the screen's filter vocabulary into the API's.
 *
 * The UI filters by event name and orders by `created_at`, because that is what
 * the rest of the app calls those things. The audit endpoint stores an action
 * integer and timestamps its rows `timestamp`, so both are mapped here rather
 * than leaking the wire names into the screen.
 */
function toAuditParams(params: ListParams): ListParams {
  const { event, subject_type, subject_id, created_at, ...rest } =
    params.filters ?? {}

  return {
    ...params,
    sortBy: params.sortBy === 'created_at' ? 'timestamp' : params.sortBy,
    filters: {
      ...rest,
      ...(event ? { action: eventToAction[event as string] } : {}),
      // `content_type__model` matches the lowercase model name the API reports
      // as `subject_type`, so history stays scoped to one model.
      ...(subject_type ? { content_type__model: subject_type } : {}),
      ...(subject_id ? { object_pk: String(subject_id) } : {}),
      ...(created_at ? { timestamp: created_at } : {}),
    },
  }
}

/** Fetch one page of audit entries, validated at the network boundary. */
export async function fetchActivityLogs(
  params: ListParams
): Promise<Paginated<ActivityLog>> {
  const res = await api.get('/activity-logs', {
    params: buildListParams(toAuditParams(params)),
  })

  return toPaginated(listSchema.parse(res.data), params)
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
 * Backs the History sheet. `subjectType` is the API's lowercase model name
 * (e.g. `product`), so history cannot collide between two models that happen to
 * share an id.
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
