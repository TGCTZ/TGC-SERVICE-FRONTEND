import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { perm } from '@/lib/permissions'
import { Payments } from '@/features/payments'

const paymentsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  search: z.string().optional().catch(''),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
  processed: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/payments/')({
  beforeLoad: requirePermission([perm('payments', 'view')]),
  validateSearch: paymentsSearchSchema,
  component: Payments,
})
