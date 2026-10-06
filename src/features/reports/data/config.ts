import { PERMISSIONS, perm } from '@/lib/permissions'

/** Mirrors the API's page gates; individual sections also require their source permissions. */
export const reportConfigs = {
  financial: {
    title: 'Financial reports',
    description: 'Bills, payments, and outstanding balances.',
    permissions: [perm('bills', 'view'), perm('payments', 'view')],
    gate: PERMISSIONS.financialReports,
  },
  operational: {
    title: 'Operational reports',
    description: 'Orders, findings, and certificates.',
    permissions: [
      perm('orders', 'view'),
      perm('stones', 'view'),
      perm('identification-reports', 'view'),
      perm('certificates', 'view'),
    ],
    gate: PERMISSIONS.operationalReports,
  },
}

export type ReportKind = keyof typeof reportConfigs

/** A report page needs the module gate, its own gate, and one readable section. */
export function canAccessReport(permissions: string[], kind: ReportKind) {
  const config = reportConfigs[kind]
  return (
    permissions.includes(PERMISSIONS.moduleReports) &&
    permissions.includes(config.gate) &&
    config.permissions.some((name) => permissions.includes(name))
  )
}

/** Used by the root and /reports redirects after the auth guard has loaded permissions. */
export function firstReportPath(permissions: string[]) {
  if (canAccessReport(permissions, 'financial')) {
    return '/reports/financial' as const
  }
  if (canAccessReport(permissions, 'operational')) {
    return '/reports/operational' as const
  }
  return '/403' as const
}
