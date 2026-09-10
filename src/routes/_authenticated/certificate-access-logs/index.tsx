import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { perm } from '@/lib/permissions'
import { CertificateAccessLogs } from '@/features/certificate-access-logs'

const logsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export const Route = createFileRoute(
  '/_authenticated/certificate-access-logs/'
)({
  beforeLoad: requirePermission([perm('certificate-access-logs', 'view')]),
  validateSearch: logsSearchSchema,
  component: CertificateAccessLogs,
})
