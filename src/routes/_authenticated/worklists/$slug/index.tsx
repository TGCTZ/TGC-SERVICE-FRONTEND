import z from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { hasAnyPermission } from '@/lib/authz'
import { Worklists } from '@/features/worklists'
import { worklistConfigBySlug } from '@/features/worklists/data/config'

const worklistSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
})

export const Route = createFileRoute('/_authenticated/worklists/$slug/')({
  /**
   * The permission depends on which queue the slug names, so the guard is
   * resolved per-request rather than with a fixed `requirePermission([...])`.
   */
  beforeLoad: ({ params }) => {
    const config = worklistConfigBySlug(params.slug)

    if (!config) throw redirect({ to: '/404' })

    if (!hasAnyPermission([config.permission])) {
      throw redirect({ to: '/403' })
    }
  },
  validateSearch: worklistSearchSchema,
  component: Worklists,
})
