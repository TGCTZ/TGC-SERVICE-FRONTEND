import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/authz'
import { Roles } from '@/features/roles'

export const Route = createFileRoute('/_authenticated/roles/')({
  beforeLoad: requirePermission(['roles.viewAny']),
  component: Roles,
})
