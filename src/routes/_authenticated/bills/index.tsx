import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { perm } from '@/lib/permissions'
import { Bills } from '@/features/bills'

const billsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  search: z.string().optional().catch(''),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
  status: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/bills/')({
  beforeLoad: requirePermission([perm('bills', 'view')]),
  validateSearch: billsSearchSchema,
  component: Bills,
})
