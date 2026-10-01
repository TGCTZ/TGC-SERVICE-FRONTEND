import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { OperationalReports } from '@/features/reports'
import { reportConfigs } from '@/features/reports/data/config'
import { reportSearchSchema } from '@/features/reports/data/schema'

export const Route = createFileRoute('/_authenticated/reports/operational/')({
  beforeLoad: requirePermission(reportConfigs.operational.permissions),
  validateSearch: reportSearchSchema,
  component: OperationalReports,
})
