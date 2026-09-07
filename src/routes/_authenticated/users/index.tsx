import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { Users } from '@/features/users'

const usersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  search: z.string().optional().catch(''),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
  statusId: z.number().optional().catch(undefined),
  isActive: z.string().optional().catch(undefined),
  showDeleted: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/users/')({
  beforeLoad: requirePermission(['users.viewAny']),
  validateSearch: usersSearchSchema,
  component: Users,
})
