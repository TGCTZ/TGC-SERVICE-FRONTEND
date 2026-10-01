import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentPermissions } from '@/lib/authz'
import { firstReportPath } from '@/features/reports/data/config'
import { reportSearchSchema } from '@/features/reports/data/schema'

export const Route = createFileRoute('/_authenticated/reports/')({
  validateSearch: reportSearchSchema,
  beforeLoad: ({ search }) => {
    const to = firstReportPath(getCurrentPermissions())
    throw redirect({ to, search: to === '/403' ? {} : search })
  },
})
