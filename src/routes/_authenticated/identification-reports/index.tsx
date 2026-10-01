import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { perm } from '@/lib/permissions'
import { Identification } from '@/features/identification'

const reportsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  search: z.string().optional().catch(''),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
  finalized: z.string().optional().catch(undefined),
  showDeleted: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/identification-reports/')(
  {
    beforeLoad: requirePermission([perm('identification-reports', 'view')]),
    validateSearch: reportsSearchSchema,
    component: Identification,
  }
)
