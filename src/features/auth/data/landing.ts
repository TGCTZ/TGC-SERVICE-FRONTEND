import { canAccessReport } from '@/features/reports/data/config'

/** Choose the first page for each station; other roles start at operational reports. */
export function landingPath(roles: string[], permissions: string[]) {
  if (roles.includes('receptionist')) return '/orders' as const
  if (roles.includes('gemmologist')) return '/identification' as const
  if (roles.includes('accountant')) return '/bills' as const

  return canAccessReport(permissions, 'operational')
    ? ('/reports/operational' as const)
    : ('/403' as const)
}
