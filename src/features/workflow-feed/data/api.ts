import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'

const rawWorkflowRowSchema = z.object({
  id: z.string(),
  kind: z.string(),
  record_id: z.number(),
  reference: z.string(),
  customer: z.string(),
  type: z.string(),
  status: z.string(),
  date: z.string().nullable(),
  waiting: z.boolean(),
  detail: z.record(z.string(), z.unknown()),
})

export const workflowRowSchema = rawWorkflowRowSchema.transform((row) => ({
  ...row,
  // DataTable uses a numeric row key; mix kind and resource id to avoid
  // collisions when an order and bill share the same database id.
  id: [...row.id].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0
  ),
}))

export type WorkflowRow = z.infer<typeof workflowRowSchema>

const responseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(workflowRowSchema),
})

export type WorkflowFeedParams = {
  page: number
  pageSize: number
  search?: string
  status?: string
  type?: string
  source?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export const workflowFeedQuery = (path: string, params: WorkflowFeedParams) =>
  queryOptions({
    queryKey: ['workflow-feed', path, params],
    queryFn: async () => {
      const res = await api.get(path, {
        params: {
          page: params.page,
          page_size: params.pageSize,
          ...(params.search ? { search: params.search } : {}),
          ...(params.status ? { status: params.status } : {}),
          ...(params.type ? { type: params.type } : {}),
          ...(params.source ? { source: params.source } : {}),
          ...(params.sortBy
            ? {
                sort: `${params.sortDir === 'desc' ? '-' : ''}${params.sortBy}`,
              }
            : {}),
        },
      })
      return responseSchema.parse(res.data)
    },
    placeholderData: (previous) => previous,
  })
