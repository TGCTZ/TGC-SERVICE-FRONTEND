import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentPermissions } from '@/lib/authz'
import { firstReportPath } from '@/features/reports/data/config'
import {
  legacyPeriod,
  legacySearchSchema,
} from '@/features/reports/data/period'

export const Route = createFileRoute('/_authenticated/')({
  validateSearch: legacySearchSchema,
  beforeLoad: ({ search }) => {
    const to = firstReportPath(getCurrentPermissions())
    throw redirect({
      to,
      search: to === '/403' ? {} : legacyPeriod(search),
    })
  },
})
