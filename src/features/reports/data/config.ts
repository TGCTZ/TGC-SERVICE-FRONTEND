import { perm } from '@/lib/permissions'

/** Mirrors the API's page gates; individual sections also require their source permissions. */
export const reportConfigs = {
  financial: {
    title: 'Financial reports',
    description:
      'Bills issued, payments collected, and balances still owed today.',
    permissions: [perm('bills', 'view'), perm('payments', 'view')],
  },
  operational: {
    title: 'Operational reports',
    description:
      'Orders received, stones registered, findings finalized, and certificates issued.',
    permissions: [
      perm('orders', 'view'),
      perm('stones', 'view'),
      perm('identification-reports', 'view'),
      perm('certificates', 'view'),
    ],
  },
}

export type ReportKind = keyof typeof reportConfigs

/** Used by the root and /reports redirects after the auth guard has loaded permissions. */
export function firstReportPath(permissions: string[]) {
  if (
    reportConfigs.financial.permissions.some((name) =>
      permissions.includes(name)
    )
  ) {
    return '/reports/financial' as const
  }
  if (
    reportConfigs.operational.permissions.some((name) =>
      permissions.includes(name)
    )
  ) {
    return '/reports/operational' as const
  }
  return '/403' as const
}
