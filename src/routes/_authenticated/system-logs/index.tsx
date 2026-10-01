import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { PERMISSIONS } from '@/lib/permissions'
import { SystemLogs } from '@/features/system-logs'

const systemLogsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(25),
  search: z.string().optional().catch(''),
  level: z.string().optional().catch(undefined),
  dateFrom: z.string().optional().catch(undefined),
  dateTo: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/system-logs/')({
  beforeLoad: requirePermission([PERMISSIONS.viewSystemLogs]),
  validateSearch: systemLogsSearchSchema,
  component: SystemLogs,
})
