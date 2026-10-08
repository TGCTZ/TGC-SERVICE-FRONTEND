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
  /**
   * An `OrderStage` value. The same filter the Orders screen carries, since
   * these are the same rows. Kept in the URL so a filtered view is shareable.
   */
  stage: z.string().optional(),
  source: z.enum(['waiting', 'records']).optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  tab: z.enum(['work', 'stones']).optional(),
  stonesPage: z.number().optional().catch(1),
  stonesPageSize: z.number().optional().catch(10),
  stonesSearch: z.string().optional().catch(''),
  stonesSortBy: z.string().optional().catch(undefined),
  stonesSortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
  stonesStatus: z.string().optional().catch(undefined),
  stonesShowDeleted: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/identification/')({
  validateSearch: identificationSearchSchema,
  beforeLoad: requirePermission([
    perm('orders', 'view'),
    perm('stones', 'view'),
  ]),
  component: IdentificationQueue,
})
