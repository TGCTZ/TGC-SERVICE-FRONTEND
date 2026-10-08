import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentPermissions } from '@/lib/authz'
import { OperationalReports } from '@/features/reports'
import { canAccessReport } from '@/features/reports/data/config'
import { reportSearchSchema } from '@/features/reports/data/schema'

export const Route = createFileRoute('/_authenticated/reports/operational/')({
  beforeLoad: () => {
    if (!canAccessReport(getCurrentPermissions(), 'operational')) {
      throw redirect({ to: '/403' })
    }
  },
  validateSearch: reportSearchSchema,
  component: OperationalReports,
})
