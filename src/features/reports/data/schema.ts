import { z } from 'zod'
import { paginatedSchema } from '@/lib/api-query'

export const reportRowSchema = z
  .object({ id: z.number() })
  .catchall(z.union([z.string(), z.number(), z.null()]))
export type ReportRow = z.infer<typeof reportRowSchema>

export const reportSectionSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  count: z.number(),
  missing_dates: z.number(),
  amounts: z.array(z.object({ currency: z.string(), amount: z.string() })),
  statuses: z.array(z.object({ status: z.string(), count: z.number() })),
})
export type ReportSection = z.infer<typeof reportSectionSchema>

const choiceSchema = z.object({
  id: z.union([z.number(), z.string()]),
  label: z.string(),
})

export const reportResultSchema = paginatedSchema(reportRowSchema).extend({
  report: z.enum(['financial', 'operational']),
  title: z.string(),
  range: z.object({ from: z.string(), to: z.string(), timezone: z.string() }),
  generated_at: z.string(),
  section: z.string(),
  sections: z.array(reportSectionSchema),
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      kind: z.enum(['text', 'date', 'money']),
    })
  ),
  filters: z.object({
    customers: z.array(choiceSchema),
    stone_types: z.array(choiceSchema),
    providers: z.array(choiceSchema),
  }),
})
export type ReportResult = z.infer<typeof reportResultSchema>

/** URL-owned filters follow the existing list routes, including one-based paging. */
export const reportSearchSchema = z.object({
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  section: z.string().optional().catch(undefined),
  customer: z.coerce.number().int().positive().optional().catch(undefined),
  status: z.string().optional().catch(undefined),
  provider: z.string().optional().catch(undefined),
  stoneType: z.coerce.number().int().positive().optional().catch(undefined),
  page: z.number().int().positive().optional().catch(1),
  pageSize: z.number().int().min(1).max(100).optional().catch(10),
})
export type ReportSearch = z.infer<typeof reportSearchSchema>
