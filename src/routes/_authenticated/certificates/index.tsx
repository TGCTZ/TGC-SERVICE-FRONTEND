import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { perm } from '@/lib/permissions'
import { Certificates } from '@/features/certificates'

const certificatesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  search: z.string().optional().catch(''),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
  status: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/certificates/')({
  beforeLoad: requirePermission([perm('certificates', 'view')]),
  validateSearch: certificatesSearchSchema,
  component: Certificates,
})
