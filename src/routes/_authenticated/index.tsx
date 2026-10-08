import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { getCurrentPermissions } from '@/lib/authz'
import { landingPath } from '@/features/auth/data/landing'
import {
  legacyPeriod,
  legacySearchSchema,
} from '@/features/reports/data/period'

export const Route = createFileRoute('/_authenticated/')({
  validateSearch: legacySearchSchema,
  beforeLoad: ({ search }) => {
    const user = useAuthStore.getState().auth.user
    const to = landingPath(user?.roles ?? [], getCurrentPermissions())
    throw redirect({
      to,
      search: to === '/reports/operational' ? legacyPeriod(search) : {},
    })
  },
})
