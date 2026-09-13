import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { perm } from '@/lib/permissions'
import { IdentificationQueue } from '@/features/identification-queue'

const identificationSearchSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  /** Defaults to `pending` in the screen, so the page opens on the work left. */
  identification: z.enum(['pending', 'complete']).optional(),
})

export const Route = createFileRoute('/_authenticated/identification/')({
  validateSearch: identificationSearchSchema,
  beforeLoad: requirePermission([perm('orders', 'view')]),
  component: IdentificationQueue,
})
