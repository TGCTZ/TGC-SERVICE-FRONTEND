import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { AuditLogs } from '@/features/audit-logs'

const auditLogsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(25),
  search: z.string().optional().catch(''),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
  event: z.string().optional().catch(undefined),
  dateFrom: z.string().optional().catch(undefined),
  dateTo: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/audit-logs/')({
  beforeLoad: requirePermission(['activity-logs.viewAny']),
  validateSearch: auditLogsSearchSchema,
  component: AuditLogs,
})
