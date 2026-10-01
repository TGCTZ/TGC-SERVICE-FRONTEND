import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { FinancialReports } from '@/features/reports'
import { reportConfigs } from '@/features/reports/data/config'
import { reportSearchSchema } from '@/features/reports/data/schema'

export const Route = createFileRoute('/_authenticated/reports/financial/')({
  beforeLoad: requirePermission(reportConfigs.financial.permissions),
  validateSearch: reportSearchSchema,
  component: FinancialReports,
})
