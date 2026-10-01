import z from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { hasAnyPermission } from '@/lib/authz'
import { perm } from '@/lib/permissions'
import { Lookups } from '@/features/lookups'
import { lookupConfigBySlug } from '@/features/lookups/data/config'

const lookupsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  search: z.string().optional().catch(''),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
  showDeleted: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/lookups/$slug/')({
  /**
   * The permission depends on which lookup the slug names, so the guard is
   * resolved per-request rather than with a fixed `requirePermission([...])`.
   */
  beforeLoad: ({ params }) => {
    const config = lookupConfigBySlug(params.slug)

    if (!config) throw redirect({ to: '/404' })

    if (!hasAnyPermission([perm(config.resource, 'view')])) {
      throw redirect({ to: '/403' })
    }
  },
  validateSearch: lookupsSearchSchema,
  component: Lookups,
})
